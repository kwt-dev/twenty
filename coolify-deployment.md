# Coolify Deployment Guide for Twenty Fork

This guide explains how to deploy the Twenty fork using the GitHub Container Registry images with Coolify.

## Prerequisites

1. GitHub repository with GHCR workflows configured
2. Coolify instance running
3. PostgreSQL and Redis services available

## Service Configuration

### 1. PostgreSQL Database Service

Create a PostgreSQL service in Coolify:
- **Image**: `postgres:16-alpine`
- **Name**: `twenty-postgres`
- **Database**: `twenty`
- **Username**: `postgres`
- **Password**: `your-secure-password`
- **Port**: `5432`

### 2. Redis Cache Service

Create a Redis service in Coolify:
- **Image**: `redis:7-alpine`
- **Name**: `twenty-redis`
- **Port**: `6379`
- **Command**: `--maxmemory-policy noeviction`

### 3. Twenty Backend Service

Create a Docker service in Coolify:

**Basic Configuration:**
- **Name**: `twenty-backend`
- **Image**: `ghcr.io/spensermcconnell/twenty/twenty-backend:latest`
- **Port**: `3200`
- **Health Check Path**: `/healthz`
- **Health Check Port**: `3200`

**Environment Variables:**
```env
NODE_ENV=production
NODE_PORT=3200
PG_DATABASE_URL=postgresql://postgres:your-secure-password@twenty-postgres:5432/twenty
REDIS_URL=redis://twenty-redis:6379/2
SERVER_URL=https://your-backend-domain.com
APP_SECRET=your-secure-app-secret-here
DISABLE_DB_MIGRATIONS=false
DISABLE_CRON_JOBS_REGISTRATION=false
STORAGE_TYPE=local
IS_CONFIG_VARIABLES_IN_DB_ENABLED=false
```

**Resource Limits:**
- **Memory**: `2G`
- **CPU**: `1000m`

**Volumes:**
- `/app/packages/twenty-server/.local-storage` → persistent volume for local storage

### 4. Twenty Worker Service

Create another Docker service in Coolify:

**Basic Configuration:**
- **Name**: `twenty-worker`
- **Image**: `ghcr.io/spensermcconnell/twenty/twenty-backend:latest`
- **Command**: `["yarn", "worker:prod"]`
- **No exposed port needed**

**Environment Variables:**
```env
NODE_ENV=production
NODE_PORT=3200
PG_DATABASE_URL=postgresql://postgres:your-secure-password@twenty-postgres:5432/twenty
REDIS_URL=redis://twenty-redis:6379/2
SERVER_URL=https://your-backend-domain.com
APP_SECRET=your-secure-app-secret-here
DISABLE_DB_MIGRATIONS=true
DISABLE_CRON_JOBS_REGISTRATION=true
STORAGE_TYPE=local
IS_CONFIG_VARIABLES_IN_DB_ENABLED=false
```

**Resource Limits:**
- **Memory**: `2G`
- **CPU**: `500m`

**Volumes:**
- `/app/packages/twenty-server/.local-storage` → same persistent volume as backend

### 5. Twenty Frontend Service

Create a Docker service in Coolify:

**Basic Configuration:**
- **Name**: `twenty-frontend`
- **Image**: `ghcr.io/spensermcconnell/twenty/twenty-frontend:latest`
- **Port**: `80`
- **Health Check Path**: `/health`
- **Health Check Port**: `80`

**Environment Variables:**
```env
REACT_APP_SERVER_BASE_URL=https://your-backend-domain.com
```

**Resource Limits:**
- **Memory**: `512M`
- **CPU**: `250m`

## Service Dependencies

Configure service dependencies in Coolify:
1. **twenty-backend** depends on: `twenty-postgres`, `twenty-redis`
2. **twenty-worker** depends on: `twenty-postgres`, `twenty-redis`, `twenty-backend`
3. **twenty-frontend** depends on: `twenty-backend`

## Domain Configuration

### Backend Domain
- Point your backend domain to the `twenty-backend` service
- Enable SSL certificate
- Example: `api.yourdomain.com` → `twenty-backend:3200`

### Frontend Domain  
- Point your frontend domain to the `twenty-frontend` service
- Enable SSL certificate
- Example: `app.yourdomain.com` → `twenty-frontend:80`

## Automatic Deployments

### Enable Webhooks
1. In Coolify, go to each service settings
2. Enable "Auto Deploy"
3. Copy the webhook URL
4. In GitHub repository settings, add webhook:
   - **URL**: Coolify webhook URL
   - **Content type**: `application/json`
   - **Events**: Push events on main branch

### Manual Deployment
You can also trigger deployments manually:
1. Go to service in Coolify
2. Click "Deploy" button
3. It will pull the latest `:latest` tag from GHCR

## Environment-Specific Configurations

### Production Environment Variables
Update these for production:
```env
# Security
APP_SECRET=generate-a-secure-secret-key-here
NEXTAUTH_SECRET=generate-another-secure-secret-here

# URLs (update with your actual domains)
SERVER_URL=https://api.yourdomain.com
REACT_APP_SERVER_BASE_URL=https://api.yourdomain.com

# Database (use your actual credentials)
PG_DATABASE_URL=postgresql://username:password@host:5432/database

# Feature flags for production
NODE_ENV=production
DISABLE_DB_MIGRATIONS=false  # true after initial setup
STORAGE_TYPE=local  # or s3 for cloud storage
```

## Monitoring and Logs

### Health Checks
- **Backend**: `GET /healthz` (returns 200 OK)
- **Frontend**: `GET /health` (returns 200 OK with "healthy" message)

### Log Access
View logs in Coolify:
1. Go to service in Coolify dashboard
2. Click "Logs" tab
3. View real-time logs or download log files

### Resource Monitoring
Monitor resource usage:
1. CPU and memory usage in Coolify dashboard
2. Set up alerts for high resource usage
3. Scale services if needed

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check PG_DATABASE_URL format
   - Ensure PostgreSQL service is running
   - Verify network connectivity between services

2. **Frontend Can't Connect to Backend**
   - Check REACT_APP_SERVER_BASE_URL points to correct backend domain
   - Verify backend service is healthy
   - Check nginx proxy configuration in frontend container

3. **Worker Not Processing Jobs**
   - Check Redis connection (REDIS_URL)
   - Verify worker service is running
   - Check backend service is creating jobs properly

4. **Image Pull Errors**
   - Ensure GHCR images are public or Coolify has access
   - Check if GitHub Actions built images successfully
   - Verify image tags exist in registry

### Debug Commands

Access service containers for debugging:
```bash
# View backend logs
docker logs twenty-backend

# Access backend container
docker exec -it twenty-backend sh

# Check database connectivity
docker exec -it twenty-backend sh -c "curl -f http://localhost:3200/healthz"

# Check frontend nginx config
docker exec -it twenty-frontend cat /etc/nginx/conf.d/default.conf
```

## Security Considerations

1. **Secrets Management**
   - Use Coolify's built-in secrets management
   - Never commit secrets to repository
   - Rotate secrets regularly

2. **Network Security**
   - Use internal networking between services
   - Only expose necessary ports publicly
   - Enable SSL/TLS for all public endpoints

3. **Container Security**
   - Images run as non-root user (uid 1000)
   - Regular security updates via automated builds
   - Minimal attack surface with Alpine base images

## Scaling

### Horizontal Scaling
- Scale frontend: Create multiple instances behind load balancer
- Scale backend: Add more backend instances with shared database/redis
- Scale worker: Add more worker instances for job processing

### Vertical Scaling
- Increase memory/CPU limits in Coolify service settings
- Monitor resource usage and adjust accordingly
- Consider dedicated nodes for database services

## Backup Strategy

### Database Backups
1. Configure automated PostgreSQL backups in Coolify
2. Schedule regular backups to external storage
3. Test backup restoration procedures

### Application Data
1. Backup persistent volumes (local storage)
2. Export application configurations
3. Document deployment procedures