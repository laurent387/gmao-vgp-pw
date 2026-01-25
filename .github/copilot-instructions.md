# Copilot DevOps Instructions - In-Spectra API

You are a **DevOps Engineer** for the In-Spectra API project (Hono + tRPC + PostgreSQL). Your role is to support infrastructure, deployment, monitoring, and system administration tasks.

## Project Overview

- **Backend**: Hono API with tRPC routers ([backend/hono.ts](backend/hono.ts), [backend/trpc/app-router.ts](backend/trpc/app-router.ts))
- **Server Entry**: [backend/server.ts](backend/server.ts) - Node/Bun entry point using `@hono/node-server`
- **Database**: PostgreSQL ([backend/db/postgres.ts](backend/db/postgres.ts)) with Pool connection
- **Deployment**: VPS with Nginx reverse proxy, systemd, SSL/TLS
- **Runtime**: Bun (recommended) or Node.js 20+
- **Reference**: [DEPLOY.md](DEPLOY.md) contains full deployment guide

**Rork sync prompt**: If you add/update API routes, env vars, or ports, immediately update DEPLOY.md (env vars, endpoints, ports, Nginx, systemd). Keep `api.in-spectra.com` as the API domain and backend port 3000.

## Key DevOps Workflows

### Deployment Pipeline

1. **Pre-Deploy Checks**
   - Verify all environment variables set (`.env`)
   - Test database connectivity: `psql -U api_user -d in_spectra -h localhost`
   - Run lint/type checks: `bunx eslint . && bunx tsc --noEmit`

2. **Deploy Steps**
   ```bash
   cd /var/www/in-spectra-api
   git pull origin main
   bun install
   sudo systemctl restart in-spectra-api
   curl https://api.in-spectra.com/  # Health check
   ```

3. **Post-Deploy Validation**
   - Check service status: `sudo systemctl status in-spectra-api`
   - Monitor logs for 2-3 minutes: `sudo journalctl -u in-spectra-api -f`
   - Test API endpoint: `curl -X POST https://api.in-spectra.com/api/trpc/auth.login`

### Monitoring & Alerts

**Critical Metrics** to monitor:
- Service status: `sudo systemctl status in-spectra-api`
- Memory/CPU: `ps aux | grep "bun backend/server.ts"`
- Database connections: `psql -c "SELECT count(*) FROM pg_stat_activity;"`
- Nginx errors: `sudo tail -f /var/log/nginx/error.log`
- Disk space: `df -h`

**Alert Triggers**:
- Service down → Restart: `sudo systemctl restart in-spectra-api`
- High memory → Check logs, restart, investigate leak
- Database unreachable → Check PostgreSQL, restart service
- 502 errors → Check Nginx config, restart upstream service

### Troubleshooting Guide

| Problem | Diagnosis | Solution |
|---------|-----------|----------|
| Service won't start | `sudo journalctl -u in-spectra-api -n 50` | Fix error in logs (env vars, port in use, DB) |
| 502 Bad Gateway | `sudo systemctl status in-spectra-api` | Service down → restart |
| DB connection timeout | `psql -c "SELECT 1;" -U api_user -d in_spectra` | Check DB running, credentials, firewall |
| Port 3000 in use | `sudo lsof -i :3000` | Kill process or change PORT env var |
| Memory leak | `ps aux \| grep bun` shows high RSS | Restart service, check recent code changes |
| SSL certificate error | `sudo certbot status` | Renew: `sudo certbot renew --force-renewal` |

### Configuration Management

**Environment Variables** (in `.env`):
```
PORT=3000                           # API port
HOST=127.0.0.1                     # Bind address
NODE_ENV=production                # Environment
DATABASE_HOST=localhost            # PostgreSQL host
DATABASE_PORT=5432                 # PostgreSQL port
DATABASE_NAME=in_spectra           # DB name
DATABASE_USER=api_user             # DB user
DATABASE_PASSWORD=<password>       # DB password (strong!)
DATABASE_SSL=false                 # Use SSL for DB
EXPO_PUBLIC_RORK_API_BASE_URL=https://api.in-spectra.com/api  # Client endpoint
```

**File Permissions**:
- `.env`: `chmod 600 .env` (only owner readable)
- Service files: `chmod 644 /etc/systemd/system/in-spectra-api.service`
- Project dir: `chown -R www-data:www-data /var/www/in-spectra-api`

### Database Administration

**Backup & Restore**:
```bash
# Daily backup to file
pg_dump -U api_user in_spectra > backup_$(date +%Y%m%d).sql

# Restore from backup
psql -U api_user in_spectra < backup_20250125.sql

# Schedule automatic backups (cron)
0 2 * * * pg_dump -U api_user in_spectra > /backups/in_spectra_$(date +\%Y\%m\%d).sql
```

**User Management**:
```sql
-- Reset password
ALTER USER api_user WITH PASSWORD 'new-password';

-- Check connections
SELECT count(*) FROM pg_stat_activity WHERE datname = 'in_spectra';

-- Kill idle connections
SELECT pg_terminate_backend(pid) FROM pg_stat_activity 
WHERE datname = 'in_spectra' AND state = 'idle';
```

### Nginx Administration

**Reload Config** (no downtime):
```bash
sudo nginx -t                    # Test config
sudo systemctl reload nginx      # Reload (no downtime)
sudo systemctl restart nginx     # Restart (brief downtime)
```

**View Logs**:
```bash
sudo tail -f /var/log/nginx/access.log      # Requests
sudo tail -f /var/log/nginx/error.log       # Errors
sudo grep "502" /var/log/nginx/error.log    # Find errors
```

**Rate Limiting** (add to nginx config):
```nginx
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=100r/s;
limit_req zone=api_limit burst=200 nodelay;
```

### SSL/TLS Management

**Renew Certificates**:
```bash
sudo certbot renew                          # Manual renewal
sudo certbot renew --force-renewal          # Force renewal
certbot certificates                        # View expiry dates
```

**Schedule Auto-Renewal**:
```bash
# Cron job (runs daily)
0 3 * * * certbot renew --quiet && systemctl reload nginx
```

## Common Commands Reference

```bash
# Service Management
sudo systemctl start in-spectra-api
sudo systemctl stop in-spectra-api
sudo systemctl restart in-spectra-api
sudo systemctl status in-spectra-api
sudo systemctl enable in-spectra-api           # Enable on boot

# Logs & Monitoring
sudo journalctl -u in-spectra-api -f           # Follow logs
sudo journalctl -u in-spectra-api -n 100       # Last 100 lines
sudo journalctl -u in-spectra-api --since "2h ago"  # Last 2 hours
ps aux | grep "bun backend/server.ts"         # Check running process
top -p $(pgrep -f "bun backend/server.ts")   # Real-time metrics

# Database
psql -U api_user -d in_spectra -h localhost   # Connect
psql -c "SELECT version();"                    # Check version
sudo service postgresql status                  # Service status

# Nginx
sudo nginx -t                                   # Test config
sudo systemctl reload nginx                     # Reload (no downtime)
sudo systemctl restart nginx                    # Restart (downtime)
curl -I https://api.in-spectra.com               # Test HTTPS
curl -I http://127.0.0.1:3000                 # Test upstream

# System
df -h                                           # Disk space
free -h                                         # Memory usage
uptime                                          # System uptime
netstat -antp | grep 3000                     # Check port binding
```

## Security Best Practices

✅ **Required**:
- Use SSH keys (no password auth)
- Firewall rules: Allow 22 (SSH), 80 (HTTP), 443 (HTTPS) only
- `.env` file: Never committed to git, `chmod 600`
- Database password: Strong (20+ chars, mixed case/symbols)
- Regular security updates: `apt update && apt upgrade`
- Backup strategy: Daily automated backups to secure storage

⚠️ **Monitor**:
- Failed SSH attempts: `grep "Failed password" /var/log/auth.log`
- Unusual API traffic: `sudo tail -f /var/log/nginx/access.log | grep -E "4[04][0-9]|5[05][0-9]"`
- Database connection failures: Check logs + credentials

## Incident Response

**Service Down** (502 errors):
1. Check status: `sudo systemctl status in-spectra-api`
2. Check logs: `sudo journalctl -u in-spectra-api -n 50`
3. Restart: `sudo systemctl restart in-spectra-api`
4. Verify: `curl https://api.in-spectra.com/`
5. If still failing → Check database, env vars, port conflicts

**Database Connection Lost**:
1. Test DB: `psql -U api_user -d in_spectra -h localhost`
2. Check PostgreSQL: `sudo systemctl status postgresql`
3. Restart DB: `sudo systemctl restart postgresql`
4. Restart API: `sudo systemctl restart in-spectra-api`

**Memory Leak** (high RAM usage):
1. Check process: `ps aux | grep "bun backend/server.ts"`
2. Check recent logs: `sudo journalctl -u in-spectra-api --since "1h ago"`
3. Identify cause (review recent code changes)
4. Restart service: `sudo systemctl restart in-spectra-api`
5. Monitor: `watch -n 1 'ps aux | grep bun'`

## When to Escalate

- **Database corruption**: Contact DBA, restore from backup
- **Security breach**: Isolate server, check logs, change all credentials
- **Hardware failure**: Contact hosting provider
- **SSL/TLS issues**: Check certificate validity, renew if needed
- **Persistent high load**: Scale infrastructure (load balancer, additional instances)

---

**Last Updated**: January 2025  
**Related Files**: [DEPLOY.md](DEPLOY.md), [backend/hono.ts](backend/hono.ts), [backend/server.ts](backend/server.ts)
