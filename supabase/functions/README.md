# Supabase Edge Functions

This directory contains Supabase Edge Functions written in TypeScript for the Deno runtime.

## 📁 Structure

```
supabase/functions/
├── deno.json                    # Deno configuration and import maps
├── .vscode/                     # VSCode settings for Deno support
│   └── settings.json
├── .env.example                 # Environment variables template
├── auth-privy/                  # Privy authentication function
│   └── index.ts
└── README.md                    # This file
```

## 🔧 Development Setup

### Prerequisites

1. **Supabase CLI**: Install the Supabase CLI
   ```bash
   # macOS
   brew install supabase/tap/supabase

   # Or via npm
   npm install -g supabase
   ```

2. **Deno** (optional, for local testing): Install Deno runtime
   ```bash
   # macOS
   brew install deno
   ```

3. **VSCode Deno Extension** (recommended): Install the official Deno extension for VSCode
   - Extension ID: `denoland.vscode-deno`
   - Or install from: https://marketplace.visualstudio.com/items?itemName=denoland.vscode-deno

### Configuration

The `deno.json` file provides:
- **Compiler Options**: Strict TypeScript settings
- **Import Maps**: Simplified imports for common dependencies
- **Linting**: Recommended rules for code quality
- **Formatting**: Consistent code style

Import maps allow you to use simplified imports:
```typescript
// Instead of:
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

// You can use:
import { createClient } from '@supabase/supabase-js';
```

## 🚀 Local Development

### 1. Start Supabase Locally

```bash
# From project root
supabase start
```

### 2. Serve Edge Functions

```bash
# Serve all functions
supabase functions serve

# Serve specific function with environment variables
supabase functions serve auth-privy --env-file supabase/functions/.env.local

# With custom port
supabase functions serve --port 54322
```

### 3. Test Functions

```bash
# Test auth-privy function
curl -X POST 'http://localhost:54321/functions/v1/auth-privy' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"privyToken":"test-token"}'
```

## 📦 Deployment

### 1. Configure Secrets

```bash
# Set required environment variables
supabase secrets set PRIVY_APP_ID=your-app-id
supabase secrets set PRIVY_APP_SECRET=your-app-secret
supabase secrets set SUPABASE_JWT_SECRET=your-jwt-secret

# Verify secrets
supabase secrets list
```

### 2. Deploy Functions

```bash
# Deploy specific function
supabase functions deploy auth-privy

# Deploy all functions
supabase functions deploy

# Deploy with no verification (skip JWT verification)
supabase functions deploy auth-privy --no-verify-jwt
```

### 3. Monitor Logs

```bash
# Real-time logs
supabase functions logs auth-privy --follow

# Recent logs
supabase functions logs auth-privy --limit 50

# Or view in Dashboard:
# https://supabase.com/dashboard/project/[project-id]/functions/[function-name]/logs
```

## 🔐 Environment Variables

Create a `.env.local` file for local development (see `.env.example`):

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret
PRIVY_APP_ID=your-privy-app-id
PRIVY_APP_SECRET=your-privy-app-secret
```

**Where to get these values:**

1. **SUPABASE_URL**: Supabase Dashboard → Project Settings → API → URL
2. **SUPABASE_SERVICE_ROLE_KEY**: Supabase Dashboard → Project Settings → API → service_role key
3. **SUPABASE_JWT_SECRET**: Supabase Dashboard → Project Settings → API → JWT Settings → JWT Secret
4. **PRIVY_APP_ID**: Privy Dashboard → Settings → App ID
5. **PRIVY_APP_SECRET**: Privy Dashboard → Settings → API Keys → App Secret

## 📝 Available Functions

### `auth-privy` (推荐用于生产)

使用 Privy Access Token 验证用户并生成 Supabase session。

**Endpoint**: `POST /functions/v1/auth-privy`

**Request Body**:
```json
{
  "privyToken": "eyJhbGciOiJFUzI1NiI..."
}
```

**Response**:
```json
{
  "success": true,
  "session": {
    "access_token": "eyJhbGciOiJIUzI1NiI...",
    "refresh_token": "...",
    "token_type": "bearer",
    "expires_in": 3600,
    "expires_at": 1234567890,
    "user": { ... }
  },
  "user": {
    "privy_user_id": "did:privy:...",
    "wallet_address": "0x...",
    "email": "user@example.com",
    "phone_number": "+1234567890",
    "role": "user"
  }
}
```

### `auth-privy-idtoken`

使用 Privy Identity Token (ES256 JWT) 进行本地验证。

**Endpoint**: `POST /functions/v1/auth-privy-idtoken`

**需要额外配置**: `PRIVY_VERIFICATION_KEY`

**Request Body**:
```json
{
  "idToken": "eyJhbGciOiJFUzI1NiI..."
}
```

### `auth-privy-simple`

最简洁的 ID Token 验证实现,适合快速原型开发。

**Endpoint**: `POST /functions/v1/auth-privy-simple`

**需要额外配置**: `PRIVY_VERIFICATION_KEY`

---

## 🎯 方案选择指南

| 方案 | 适用场景 | 配置复杂度 | 性能 |
|------|---------|-----------|------|
| `auth-privy` | 生产环境,所有项目 | ⭐ 简单 | ⭐⭐ 中等 |
| `auth-privy-idtoken` | 需要高性能,降低 API 调用 | ⭐⭐⭐ 复杂 | ⭐⭐⭐ 快 |
| `auth-privy-simple` | 快速原型,学习参考 | ⭐⭐ 中等 | ⭐⭐⭐ 快 |

**推荐**: 如果不确定,使用 `auth-privy`

详细对比请查看: [Privy Auth Implementation Guide](../../docs/PRIVY_AUTH_IMPLEMENTATION_GUIDE.md)

## 🐛 Debugging

### Common Issues

1. **TypeScript Errors in IDE**
   - Ensure VSCode Deno extension is installed and enabled
   - The `.vscode/settings.json` should enable Deno for this directory
   - Reload VSCode window if needed

2. **Import Resolution Errors**
   - Check `deno.json` import maps are correctly configured
   - Ensure you're using the mapped import names

3. **Function Deployment Fails**
   - Verify all secrets are set: `supabase secrets list`
   - Check function logs: `supabase functions logs [function-name]`
   - Ensure Supabase CLI is linked to correct project

4. **CORS Errors**
   - Verify `corsHeaders` are properly set in function
   - Check OPTIONS request handler is implemented

## 📚 Resources

- [Supabase Edge Functions Documentation](https://supabase.com/docs/guides/functions)
- [Deno Manual](https://deno.land/manual)
- [Deno Standard Library](https://deno.land/std)
- [JOSE (JWT) Library](https://github.com/panva/jose)
- [Privy API Reference](https://docs.privy.io/reference/api/rest)

## 🧪 Testing

### Unit Testing (Future)

```bash
# Run tests (when implemented)
deno test --allow-env --allow-net
```

### Integration Testing

Use the Supabase CLI to test functions in a local environment:

```bash
# Start local Supabase
supabase start

# Serve function
supabase functions serve auth-privy

# Test with real Privy token
curl -X POST 'http://localhost:54321/functions/v1/auth-privy' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"privyToken":"your-real-privy-token"}'
```

## 🔄 CI/CD

For automated deployment, use GitHub Actions:

```yaml
# .github/workflows/deploy-functions.yml
name: Deploy Edge Functions

on:
  push:
    branches: [main]
    paths:
      - 'supabase/functions/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: supabase/setup-cli@v1
      - run: supabase functions deploy --project-ref ${{ secrets.SUPABASE_PROJECT_REF }}
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
```

---

For detailed authentication architecture and deployment guides, see:
- `docs/AUTH_IMPLEMENTATION_V2.md` - V2 authentication details
- `docs/EDGE_FUNCTION_DEPLOYMENT.md` - Deployment guide
- `docs/QUICKSTART.md` - Quick start guide
