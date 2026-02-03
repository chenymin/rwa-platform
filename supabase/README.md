# Supabase Setup

## Initial Setup

1. Create a new project at https://supabase.com
2. Copy your project URL and anon key to `.env.local`
3. Run the migration:

```bash
# Copy the SQL from migrations/001_initial_schema.sql
# Paste into Supabase SQL Editor and run
```

## Storage Buckets

Create these buckets in Supabase Storage:

1. `artwork-images` - Public bucket for artwork images
2. `certificates` - Private bucket for certificates

## Environment Variables

Add to `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```
