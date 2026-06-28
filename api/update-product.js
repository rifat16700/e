// Vercel Serverless Function — POST /api/update-product
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
        if (!payload || !payload.id) throw new Error("No payload or id provided");

        const productId = payload.id;
        const updateFields = [];
        const params = [];

        const allowedFields = [
            'name', 'sku', 'description', 'base_price', 'flash_sale_price', 'flash_sale_end',
            'video_url', 'video_type', 'is_active', 'is_featured', 'is_add_once'
        ];

        for (const field of allowedFields) {
            if (payload[field] !== undefined) {
                updateFields.push(`${field} = ?`);
                params.push(field.startsWith('is_') ? (payload[field] ? 1 : 0) : payload[field]);
            }
        }
        if (payload.gallery_images !== undefined) {
            updateFields.push('gallery_images = ?');
            params.push(JSON.stringify(payload.gallery_images));
        }
        if (payload.variants !== undefined) {
            updateFields.push('variants = ?');
            params.push(JSON.stringify(payload.variants));
        }

        if (updateFields.length > 0) {
            const query = `UPDATE products SET ${updateFields.join(', ')} WHERE id = ?`;
            params.push(productId);

            const d1Res = await fetch(
                `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNT_ID}/d1/database/${process.env.CF_DB_ID}/query`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.CF_WRITE_TOKEN}` },
                    body: JSON.stringify({ sql: query, params })
                }
            );
            const data = await d1Res.json();
            if (!data.success) throw new Error(data.errors?.[0]?.message || 'D1 Error');
        }

        // Sync categories
        if (payload.category_ids !== undefined) {
            const catQueries = [{ sql: "DELETE FROM product_categories WHERE product_id = ?", params: [productId] }];
            for (const cid of payload.category_ids) {
                catQueries.push({ sql: "INSERT INTO product_categories (product_id, category_id) VALUES (?, ?)", params: [productId, cid] });
            }
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
