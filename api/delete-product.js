// Vercel Serverless Function — POST /api/delete-product
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
        const { id } = req.body;
        if (!id) throw new Error("No id provided");

        const queries = [
            { sql: "DELETE FROM product_categories WHERE product_id = ?", params: [id] },
            { sql: "DELETE FROM products WHERE id = ?", params: [id] }
        ];

        const d1Res = await fetch(
            `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNT_ID}/d1/database/${process.env.CF_DB_ID}/query`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.CF_WRITE_TOKEN}`
                },
                body: JSON.stringify(queries)
            }
        );

        const data = await d1Res.json();
        if (!data.success) throw new Error(data.errors?.[0]?.message || 'D1 Error');

        return res.status(200).json({ success: true });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
}
