const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envPath = path.join(__dirname, '../.env.local');
const envVars = {};
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const firstEquals = trimmed.indexOf('=');
    if (firstEquals === -1) return;
    const key = trimmed.substring(0, firstEquals).trim();
    const val = trimmed.substring(firstEquals + 1).trim().replace(/^['"]|['"]$/g, '');
    envVars[key] = val;
  });
}

const supabaseUrl = envVars.SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY || envVars.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  try {
    const { data: config } = await supabase.from('configurations').select('*').eq('is_active', true).maybeSingle();
    if (!config) {
      console.log('No configuration found');
      return;
    }
    const devToken = config.google_developer_token;
    const clientId = config.google_client_id;
    const clientSecret = config.google_client_secret;
    const refreshToken = config.google_refresh_token;
    const customerId = config.google_customer_id.replace(/-/g, '');
    const managerId = config.google_manager_id ? config.google_manager_id.replace(/-/g, '') : null;

    const { GoogleAdsApi } = await import('google-ads-api');
    
    const client = new GoogleAdsApi({
      client_id: clientId,
      client_secret: clientSecret,
      developer_token: devToken,
    });

    const customer = client.Customer({
      customer_id: customerId,
      refresh_token: refreshToken,
      login_customer_id: managerId ? managerId : undefined,
    });

    console.log('Fetching account budgets...');
    try {
      const budgetQuery = `
        SELECT
          account_budget.id,
          account_budget.name,
          account_budget.status,
          account_budget.billing_setup,
          account_budget.approved_spending_limit_micros,
          account_budget.adjusted_spending_limit_micros,
          account_budget.amount_served_micros,
          account_budget.proposed_spending_limit_micros,
          account_budget.approved_start_date_time,
          account_budget.approved_end_date_time
        FROM account_budget
      `;
      const budgetResponse = await customer.query(budgetQuery);
      console.log('Budget Response:', JSON.stringify(budgetResponse, null, 2));
    } catch (e) {
      console.error('Failed to query account_budget:', e.message);
    }

    console.log('\nFetching billing setups...');
    try {
      const billingQuery = `
        SELECT
          billing_setup.id,
          billing_setup.status,
          billing_setup.payments_account,
          billing_setup.payments_account_info.payments_account_id,
          billing_setup.payments_account_info.payments_account_name,
          billing_setup.payments_account_info.payments_profile_id,
          billing_setup.payments_account_info.payments_profile_name
        FROM billing_setup
      `;
      const billingResponse = await customer.query(billingQuery);
      console.log('Billing Response:', JSON.stringify(billingResponse, null, 2));
    } catch (e) {
      console.error('Failed to query billing_setup:', e.message);
    }

  } catch (err) {
    console.error('Error:', err);
  }
}

run();
