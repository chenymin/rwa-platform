#!/bin/bash

# Setup Supabase Edge Function Secrets
# This script helps you set environment variables for deployed edge functions

echo "🔧 Supabase Edge Function Secrets Setup"
echo "========================================"
echo ""
echo "Since Supabase CLI is not installed, please set these environment variables manually:"
echo ""
echo "1. Visit: https://supabase.com/dashboard/project/nfjkrddcteplefvmcvgp/settings/functions"
echo ""
echo "2. For each Edge Function (auth-privy), add these secrets:"
echo ""
echo "   PRIVY_APP_ID"
echo "   cmko6jj3200dljv0cv4doct1p"
echo ""
echo "   SUPABASE_URL"
echo "   https://nfjkrddcteplefvmcvgp.supabase.co"
echo ""
echo "   SUPABASE_SERVICE_ROLE_KEY"
echo "   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mamtyZGRjdGVwbGVmdm1jdmdwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODk3NTM3NywiZXhwIjoyMDg0NTUxMzc3fQ.e_l1LlUV2PMTgmlepyfts8Hzmoyhct2ehXDuqQcZowE"
echo ""
echo "   SUPABASE_JWT_SECRET"
echo "   oPa8nQuv4GnpwfJuZM1KjC+7Y55r5kBmF0LyLkCwwqtTss0cazkHE7M3/a3psUlaWOqghzrBJAw+FH/2jNA9mQ=="
echo ""
echo "3. After adding all variables, the function will automatically redeploy"
echo ""
echo "4. Test your function at:"
echo "   https://nfjkrddcteplefvmcvgp.supabase.co/functions/v1/auth-privy"
echo ""
echo "========================================"
echo ""
echo "📋 Quick Copy (Paste into Supabase Dashboard):"
echo ""
cat << 'EOF'
Name: PRIVY_APP_ID
Value: cmko6jj3200dljv0cv4doct1p

Name: SUPABASE_URL
Value: https://nfjkrddcteplefvmcvgp.supabase.co

Name: SUPABASE_SERVICE_ROLE_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mamtyZGRjdGVwbGVmdm1jdmdwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODk3NTM3NywiZXhwIjoyMDg0NTUxMzc3fQ.e_l1LlUV2PMTgmlepyfts8Hzmoyhct2ehXDuqQcZowE

Name: SUPABASE_JWT_SECRET
Value: oPa8nQuv4GnpwfJuZM1KjC+7Y55r5kBmF0LyLkCwwqtTss0cazkHE7M3/a3psUlaWOqghzrBJAw+FH/2jNA9mQ==
EOF
