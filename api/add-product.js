// Vercel Serverless Function — POST /api/add-product
const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

export default async function handler(req, res) {
    Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v));
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method Not Allowed' });

    try {
        const payload = req.body;
        if (!payload) throw new Error("No payload provided");

        const productId = payload.id || crypto.randomUUID();

        const query = `
            INSERT INTO products (
                id, name, sku, description, base_price, flash_sale_price, flash_sale_end,
                video_url, video_type, is_active, is_featured, is_add_once, gallery_images, variants
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const params = [
            productId,
            payload.name || '',
            payload.sku || '',
            payload.description || '',
            payload.base_price || 0,
            payload.flash_sale_price || 0,
            payload.flash_sale_end || null,
            payload.video_url || null,
            payload.video_type || 'auto',
            payload.is_active ? 1 : 0,
            payload.is_featured ? 1 : 0,
            payload.is_add_once ? 1 : 0,
            JSON.stringify(payload.gallery_images || []),
            JSON.stringify(payload.variants || [])
        ];

        const d1Res = await fetch(
            `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNT_ID}/d1/database/${process.env.CF_DB_ID}/query`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.CF_WRITE_TOKEN}`
                },
                body: JSON.stringify({ sql: query, params })
            }
        );

        const data = await d1Res.json();
        if (!data.success) throw new Error(data.errors?.[0]?.message || 'D1 Error');

        // Insert category mappings
        if (payload.category_ids && payload.category_ids.length > 0) {
            const catQueries = payload.category_ids.map(cid => ({
                sql: "INSERT INTO product_categories (product_id, category_id) VALUES (?, ?)",
                params: [productId, cid]
            }));
            await fetch(
                `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNT_ID}/d1/database/${process.env.CF_DB_ID}/query`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.CF_WRITE_TOKEN}` },
                    body: JSON.stringify(catQueries)
                }
            );
        }

        return res.status(200).json({ success: true, id: productId });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
}
