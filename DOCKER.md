# ByteStart Platform - Docker Deployment Guide

## Quick Start

### Option 1: API Only (Recommended for separate frontend deployment)
```bash
docker compose up -d api db
```

### Option 2: Full Stack (API + Frontend + Database)
```bash
docker compose --profile full-stack up -d
```

## Environment Variables

Create a `.env` file in the project root:

```env
# Database
DB_PASSWORD=your_secure_password

# JWT
JWT_SECRET=your_jwt_secret_min_32_chars

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=https://your-domain.com/auth/google/callback

# Frontend
FRONTEND_URL=https://your-frontend-domain.com

# Razorpay
RAZORPAY_KEY_ID=rzp_live_xxxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret

# SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Ports (optional)
API_PORT=3000
WEB_PORT=3001
```

## Architecture

```
┌─────────────────┐      ┌─────────────────┐
│   Next.js Web   │──────│   NestJS API    │
│   (Port 3001)   │      │   (Port 3000)   │
└─────────────────┘      └────────┬────────┘
                                  │
                         ┌────────▼────────┐
                         │   PostgreSQL    │
                         │   (Port 5432)   │
                         └─────────────────┘
```

## Services

| Service | Port | Description |
|---------|------|-------------|
| `api` | 3000 | NestJS REST API Backend |
| `web` | 3001 | Next.js Frontend (optional) |
| `db` | 5432 | PostgreSQL Database (internal) |

## Commands

```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f api

# Stop all services
docker compose down

# Rebuild after code changes
docker compose up -d --build api

# Access database
docker compose exec db psql -U postgres -d bytestart

# Run migrations (if needed)
docker compose exec api npx prisma migrate deploy
```

## Production Deployment

### Coolify / aaPanel / Portainer

1. **Push code to Git repository** (GitHub, GitLab, etc.)
2. **Create new service** from Docker Compose
3. **Set environment variables** in the hosting panel UI
4. **Deploy** - Auto-builds and starts services

### Manual Docker Deployment

```bash
# 1. Clone repository
git clone https://github.com/ChiragDhawan630/bytestartsubs.git
cd bytestartsubs

# 2. Configure environment
cp .env.example .env
nano .env  # Edit with your values

# 3. Start services
docker compose up -d

# 4. Check health
docker compose ps
curl http://localhost:3000/
```

## Health Checks

- **API Health:** `http://localhost:3000/`
- **Public Plans:** `http://localhost:3000/public/plans`
- **Database:** Auto-checked by Docker

## Troubleshooting

### API won't start
```bash
# Check logs
docker compose logs api

# Check database connection
docker compose exec api env | grep DATABASE_URL
```

### Database connection failed
```bash
# Verify database is healthy
docker compose ps db

# Check PostgreSQL logs
docker compose logs db
```

### Port conflicts
```bash
# Change ports in .env
API_PORT=3100
WEB_PORT=3101

# Restart
docker compose up -d
```

## Volume Management

```bash
# Backup database
docker compose exec db pg_dump -U postgres bytestart > backup.sql

# Restore database
cat backup.sql | docker compose exec -T db psql -U postgres -d bytestart

# Remove volumes (WARNING: deletes all data)
docker compose down -v
```

## Security Notes

1. **Change default passwords** in `.env`
2. **Use HTTPS** in production
3. **Set secure JWT_SECRET** (min 32 characters)
4. **Restrict database access** (don't expose port 5432)
5. **Enable firewall rules** for ports 3000/3001 only

## CI/CD Integration

GitHub Actions automatically builds and pushes images to `ghcr.io`:

```yaml
# Use in your compose.yaml instead of building
api:
  image: ghcr.io/chiragdhawan630/bytestartsubs-api:latest
  # ... rest of config
```

---

**For more information, see:** [AGENT.md](./AGENT.md) and [CATALOG.md](./CATALOG.md)
