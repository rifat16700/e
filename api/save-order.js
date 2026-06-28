// Vercel Serverless Function — POST /api/save-order
const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

export default async function handler(req, res) {
    // Handle CORS preflight
    Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v));
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method Not Allowed' });

    try {
        const { orderData } = req.body;
        if (!orderData) throw new Error("No orderData provided");

        const query = `
            INSERT INTO orders (
                id, customer_name, customer_phone, customer_email,
                division, district, upazila, address,
                items, addons, subtotal, addon_total, delivery_charge,
                promo_code, promo_discount, grand_total, advance_payable,
                payment_method, payment_status, payment_trx_id, payment_sender,
                status, order_type
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const params = [
            orderData.id || null,
            orderData.customer_name || null,
            orderData.customer_phone || null,
            orderData.customer_email || null,
            orderData.division || null,
            orderData.district || null,
            orderData.upazila || null,
            orderData.address || null,
            JSON.stringify(orderData.items || []),
            JSON.stringify(orderData.addons || []),
            orderData.subtotal || 0,
            orderData.addon_total || 0,
            orderData.delivery_charge || 0,
            orderData.promo_code || null,
            orderData.promo_discount || 0,
            orderData.grand_total || 0,
            orderData.advance_payable || 0,
            orderData.payment_method || null,
            orderData.payment_status || 'Unpaid',
            orderData.payment_trx_id || null,
            orderData.payment_sender || null,
            orderData.status || 'Pending',
            orderData.order_type || 'delivery'
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

        return res.status(200).json({ success: true });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
}
