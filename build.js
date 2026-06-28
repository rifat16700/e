const fs = require('fs');
const path = require('path');

const s = (val) => (val || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");

const configJs = `// ============================================================
// Auto-generated during Cloudflare Build
// ============================================================

var CONFIG = {
    // ── DB Provider ──────────────────────────────────────────
    DB_PROVIDER: '${s(process.env.DB_PROVIDER) || 'cf_db'}',

    // ── Supabase ─────────────────────────────────────────────
    SUPABASE_URL:      '${s(process.env.SUPABASE_URL)}',
    SUPABASE_ANON_KEY: '${s(process.env.SUPABASE_ANON_KEY)}',

    // ── Appwrite ─────────────────────────────────────────────
    APPWRITE_ENDPOINT:    '${s(process.env.APPWRITE_ENDPOINT)}',
    APPWRITE_PROJECT:     '${s(process.env.APPWRITE_PROJECT)}',
    APPWRITE_DATABASE_ID: '${s(process.env.APPWRITE_DATABASE_ID)}',

    // ── Cloudflare D1 (Read Only via _redirects proxy) ───────
    CF_ACCOUNT_ID:    '${s(process.env.CF_ACCOUNT_ID)}',
    CF_DB_ID:         '${s(process.env.CF_DB_ID)}',
    CF_D1_READ_TOKEN: '${s(process.env.CF_D1_READ_TOKEN)}',

    // ── Vercel Write API Base URL ─────────────────────────────
    // Set VERCEL_API_BASE in Cloudflare Pages env vars
    // Example: https://your-project-name.vercel.app
    VERCEL_API_BASE: '${s(process.env.VERCEL_API_BASE)}',

    // ── Frontend Constants ───────────────────────────────────
    CART_KEY:         'fbr_cart',
    DIRECT_ORDER_KEY: 'fbr_direct_order',
    SESSION_KEY:      'fbr_session',
    ADMIN_PATH:       '/admin',
};
`;


const configPath = path.join(__dirname, 'assets', 'js', 'config.js');
fs.writeFileSync(configPath, configJs, 'utf8');
console.log('✅ assets/js/config.js generated successfully during build!');

// ── Generate _redirects for CF D1 API Proxy ──────────────────
if (process.env.CF_ACCOUNT_ID && process.env.CF_DB_ID) {
    const redirectsContent = `/api/d1-query https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNT_ID}/d1/database/${process.env.CF_DB_ID}/query 200\n`;
    const redirectsPath = path.join(__dirname, '_redirects');
    fs.writeFileSync(redirectsPath, redirectsContent, 'utf8');
    console.log('✅ _redirects file generated successfully during build!');
} else {
    console.warn('⚠️ CF_ACCOUNT_ID and/or CF_DB_ID not found in environment variables. _redirects might not be fully configured.');
}

// ── Cache Busting for HTML files ─────────────────────────────
const timestamp = Date.now();
const directories = [__dirname, path.join(__dirname, 'admin')];

directories.forEach(dir => {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        if (file.endsWith('.html')) {
            const filePath = path.join(dir, file);
            let content = fs.readFileSync(filePath, 'utf8');
            const updatedContent = content.replace(/assets\/js\/config\.js\?v=\d+/g, `assets/js/config.js?v=${timestamp}`);
            if (content !== updatedContent) {
                fs.writeFileSync(filePath, updatedContent, 'utf8');
                console.log(`✅ Cache busted config.js in ${file}`);
            }
        }
    });
});
