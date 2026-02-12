require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

console.log('--- Debugging Environment ---');
console.log(`SUPABASE_URL: ${SUPABASE_URL ? 'Loaded' : 'MISSING'}`);
console.log(`SUPABASE_KEY: ${SUPABASE_KEY ? 'Loaded (' + SUPABASE_KEY.substring(0, 5) + '...)' : 'MISSING'}`);

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Missing env vars');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
    }
});

async function run() {
    console.log('\n--- Testing Connection ---');
    try {
        const { count, error } = await supabase
            .from('tenants')
            .select('*', { count: 'exact', head: true });

        if (error) {
            console.error('Connection Failed:', error.message);
            console.error('Details:', error);
            if (error.code) console.error('Code:', error.code);
            if (error.hint) console.error('Hint:', error.hint);
        } else {
            console.log(`Connection Successful! Tenant count: ${count}`);
            await checkConfig();
        }
    } catch (err) {
        console.error('Exception:', err);
    }
}

async function checkConfig() {
    console.log('\n--- Checking MercadoPago Config ---');

    // 1. Get Tenants
    const { data: tenants, error: tenantsError } = await supabase
        .from('tenants')
        .select('id, subdomain, name');

    if (tenantsError) {
        console.error('Error fetching tenants:', tenantsError);
        return;
    }

    // 2. Get Configs
    const { data: configs, error: configsError } = await supabase
        .from('mercadopago_config')
        .select('*');

    if (configsError) console.error('Error fetching configs:', configsError);

    console.log(`\nTenants found: ${tenants.length}`);
    tenants.forEach(t => {
        const config = configs?.find(c => c.tenant_id === t.id);
        console.log(`\nTenant: ${t.name} (${t.subdomain}) ID: ${t.id}`);
        if (config) {
            console.log(`  ✅ Config Found: Enabled=${config.enabled}, Sandbox=${config.is_sandbox}`);
            console.log(`  Public Key: ${config.public_key ? 'Set' : 'Missing'}`);
            console.log(`  Access Token: ${config.access_token_encrypted ? 'Set' : 'Missing'}`);
        } else {
            console.log(`  ❌ NO CONFIGURATION`);
        }
    });
}

run();
