# FitAI Deployment Guide

## Prerequisites

- Node.js 20+
- pnpm 10+
- Docker & Docker Compose (for local Docker deployment)
- Vercel CLI (for Vercel deployment)
- Environment variables configured

## Environment Setup

### Copy and configure environment files

```bash
cp apps/web/.env.example apps/web/.env.local
cp apps/web/.env.production.example apps/web/.env.production.local
```

Fill in all required variables from Clerk, Supabase, Anthropic, Upstash, etc.

## Option 1: Vercel Deployment (Recommended for Production)

### 1. Install Vercel CLI
```bash
npm install -g vercel
```

### 2. Deploy to Vercel
```bash
vercel --cwd apps/web
```

### 3. Configure Environment Variables in Vercel Dashboard
- Go to Project Settings → Environment Variables
- Add all variables from .env.production.example
- For Database: Use Supabase with PgBouncer enabled
  - DATABASE_URL: connection string with pgbouncer=true
  - DIRECT_URL: direct connection string for migrations

### 4. Set Up Database
```bash
# Run migrations on Vercel
vercel env pull
pnpm exec prisma migrate deploy

# Seed data (optional, staging only)
pnpm exec prisma db seed
```

### 5. Configure Clerk Webhook
- In Clerk dashboard, add Vercel deployment domain
- Add webhook endpoint: https://your-vercel-domain.vercel.app/api/clerk/webhook

### 6. Run Migrations
Migrations run automatically on deployment if configured in Vercel build command, or manually:
```bash
pnpm exec prisma migrate deploy
```

## Option 2: Docker Deployment (Local / Self-Hosted)

### 1. Build Docker image
```bash
docker build -t fitai-web -f apps/web/Dockerfile .
```

### 2. Start with docker-compose
```bash
# Create .env.local from .env.example
docker compose up -d
```

### 3. Run migrations
```bash
docker compose exec app npx prisma migrate deploy
```

### 4. Seed data (optional)
```bash
docker compose exec app npx prisma db seed
```

### 5. Access application
- App: http://localhost:3000
- Database: postgres://fitai:fitai_dev@localhost:5432/fitai
- Redis (if enabled): redis://localhost:6379

### Optional: Enable Redis
```bash
docker compose --profile redis up -d
```

## Health Check

```bash
curl http://localhost:3000/api/health
# Should return 200 OK
```

## Database Seeding

### Local Development
```bash
pnpm exec prisma db seed
```

### Docker
```bash
docker compose exec app npx prisma db seed
```

### Vercel / Production
⚠️ Only seed staging/development environments. Production should not auto-seed.

## CI/CD Pipeline

The GitHub Actions workflow (`.github/workflows/ci.yml`) runs:
1. **Quality**: TypeScript type checking + ESLint
2. **Test**: Vitest integration tests
3. **Build**: Next.js standalone build
4. **Docker**: Validates Docker image builds (no push)

All steps must pass before merging to main.

## Troubleshooting

### Database Connection Issues
- Verify DATABASE_URL is correct format
- For Supabase: Enable pgbouncer, use both DATABASE_URL and DIRECT_URL
- Check firewall rules allow connection from app server

### Build Fails
- Clear Next.js cache: `rm -rf apps/web/.next`
- Reinstall dependencies: `pnpm install`
- Check Node.js version: `node --version` (should be 20+)

### Docker Build Fails
- Ensure monorepo structure is preserved in COPY commands
- Check Prisma schema exists at `apps/web/prisma/schema.prisma`
- Verify pnpm-lock.yaml is up to date

### Migration Issues
- Reset database (dev only): `pnpm exec prisma migrate reset`
- View migration status: `pnpm exec prisma migrate status`
- Rollback: Create a new migration file with rollback SQL

## Performance Optimization

1. **Image Optimization**
   - Next.js Image component handles optimization
   - Configure allowed image domains in next.config.ts

2. **Database Indexing**
   - Schema includes indexes on frequently queried columns
   - Monitor slow queries in Supabase dashboard

3. **Caching**
   - Use Redis via Upstash for session caching
   - Next.js ISR (Incremental Static Regeneration) for static pages

## Security Checklist

- [ ] All environment variables are set and secure
- [ ] Clerk webhook is configured and verified
- [ ] Supabase Row Level Security (RLS) policies are set
- [ ] API routes validate Clerk auth
- [ ] CORS policies are configured
- [ ] Rate limiting is enabled on API routes
- [ ] Database credentials are rotated regularly

## Monitoring

- **Vercel Analytics**: Monitor deployment, build times, Web Vitals
- **Supabase Logs**: Check database query performance
- **Sentry** (optional): Add error tracking to Vercel project
- **Application Logs**: View server logs in Vercel dashboard

## Rollback

### Vercel
```bash
vercel rollback
```

### Docker
```bash
docker compose down
# Redeploy previous image
docker compose up -d
```

## Support & Documentation

- [Next.js Deployment Docs](https://nextjs.org/docs/deployment)
- [Vercel Docs](https://vercel.com/docs)
- [Prisma Deployment](https://www.prisma.io/docs/guides/deployment)
- [Docker & Compose](https://docs.docker.com/compose/)
- [Supabase Docs](https://supabase.io/docs)
