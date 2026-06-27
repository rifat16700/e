export async function onRequestPost(context) {
    const { request } = context;
    const url = "https://api.cloudflare.com/client/v4/accounts/c834fa874fd883796c57f284d4d73c09/d1/database/6ba8acd5-5309-42e9-ba15-5219731d1630/query";
    
    try {
        const body = await request.text();
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": request.headers.get("Authorization")
            },
            body: body
        });

        const data = await response.json();
        return new Response(JSON.stringify(data), {
            status: response.status,
            headers: { "Content-Type": "application/json" }
        });
    } catch (err) {
        return new Response(JSON.stringify({ success: false, error: err.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}
