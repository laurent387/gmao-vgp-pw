# VPS Deployment Guide - In-Spectra API

## Prerequisites

- **OS**: Ubuntu 24.04 (or Debian 12+)
- **Node Runtime**: Bun (recommended) or Node.js 20+
- **Database**: PostgreSQL 14+
- **Reverse Proxy**: Nginx
- **Domain**: Must have DNS pointing to VPS IP

## Quick Start

### 1. Server Setup

```bash
# Clone repository
git clone <your-repo-url> /var/www/in-spectra-api
cd /var/www/in-spectra-api

# Install Bun (if not already installed)
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc

# Make Bun available system-wide for systemd
sudo ln -sf ~/.bun/bin/bun /usr/local/bin/bun

# Install dependencies
bun install

# Set environment variables
cp .env.example .env
nano .env  # Edit with your PostgreSQL credentials
```

### 2. Environment Variables

Create `.env` file in project root:

```env
# API Configuration
PORT=3100
HOST=0.0.0.0
NODE_ENV=production

# Database (PostgreSQL)
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=in_spectra
DATABASE_USER=api_user
DATABASE_PASSWORD=<strong-password>
DATABASE_SSL=false

# Client Configuration
EXPO_PUBLIC_RORK_API_BASE_URL=https://api.in-spectra.com/api
```

### 3. Database Setup

```bash
# Connect to PostgreSQL
sudo -u postgres psql

# Create database and user
CREATE DATABASE in_spectra;
CREATE USER api_user WITH PASSWORD 'strong-password';
GRANT ALL PRIVILEGES ON DATABASE in_spectra TO api_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO api_user;
\q

# Run migrations (if applicable)
# bun run migrate  # Add this script to package.json if needed
```

### 4. Systemd Service

Create `/etc/systemd/system/in-spectra-api.service`:

```ini
[Unit]
Description=In-Spectra API Server
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/in-spectra-api
Environment="PORT=3100"
Environment="HOST=0.0.0.0"
Environment="NODE_ENV=production"
EnvironmentFile=/var/www/in-spectra-api/.env

ExecStart=/usr/local/bin/bun backend/server.ts
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable in-spectra-api
sudo systemctl start in-spectra-api
sudo systemctl status in-spectra-api

# View logs
sudo journalctl -u in-spectra-api -f
```

### 5. Nginx Reverse Proxy

Create `/etc/nginx/sites-available/in-spectra-api`:

```nginx
upstream in_spectra_api {
    server 127.0.0.1:3100;
}

server {
    listen 80;
    server_name api.in-spectra.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.in-spectra.com;

    ssl_certificate /etc/letsencrypt/live/api.in-spectra.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.in-spectra.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Gzip compression
    gzip on;
    gzip_types application/json application/javascript text/plain;

    # API endpoints
    location /api/trpc {
        proxy_pass http://in_spectra_api/api/trpc;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
    - Attachments (Documents & Médias):
        - Upload: `POST /api/attachments/upload` (Bearer token obligatoire, vérifie rôle pour PDF de rapport)
        - Download (signed/local): `GET /api/attachments/download/<storageKey>` (private => admin/HSE seulement)
        - Stockage local: répertoire `uploads/` (configurable via `UPLOADS_DIR`)
        - Limites: PDF ≤ 20MB, Image ≤ 8MB ; MIME autorisés: pdf, jpeg, png, webp, heic/heif
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check
    location / {
        proxy_pass http://in_spectra_api;
        proxy_set_header Host $host;
    }
}
```

Enable:

```bash
sudo ln -s /etc/nginx/sites-available/in-spectra-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 5.1 Nginx - Landing Page (in-spectra.com)

Prepare static root (before enabling the site):

```bash
sudo mkdir -p /var/www/in-spectra-landing
sudo chown -R www-data:www-data /var/www/in-spectra-landing
sudo chmod 755 /var/www/in-spectra-landing
# Copy your built landing files (index.html, assets) here; files should be 644.
```

If you host a static landing page on the same VPS, place the files in `/var/www/in-spectra-landing` and create:

`/etc/nginx/sites-available/in-spectra-landing`

```nginx
server {
    listen 80;
    server_name in-spectra.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name in-spectra.com;

    # Using the SAN cert issued for api.in-spectra.com (covers in-spectra.com)
    ssl_certificate /etc/letsencrypt/live/api.in-spectra.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.in-spectra.com/privkey.pem;

    root /var/www/in-spectra-landing;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Enable:

```bash
sudo ln -s /etc/nginx/sites-available/in-spectra-landing /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 5.2 Nginx - Web App (app.in-spectra.com)

Prepare static root (before enabling the site):

```bash
sudo mkdir -p /var/www/in-spectra-app
sudo chown -R www-data:www-data /var/www/in-spectra-app
sudo chmod 755 /var/www/in-spectra-app
# Copy your built app files (index.html, assets) here; files should be 644.
```

If your app is hosted as a static web build on the VPS, place the files in `/var/www/in-spectra-app` and create:

`/etc/nginx/sites-available/in-spectra-app`

```nginx
server {
    listen 80;
    server_name app.in-spectra.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name app.in-spectra.com;

    # Using the SAN cert issued for api.in-spectra.com (covers app.in-spectra.com)
    ssl_certificate /etc/letsencrypt/live/api.in-spectra.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.in-spectra.com/privkey.pem;

    root /var/www/in-spectra-app;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Enable:

```bash
sudo ln -s /etc/nginx/sites-available/in-spectra-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 6. SSL Certificate (Let's Encrypt)

```bash
sudo apt update
sudo apt install -y certbot python3-certbot-nginx
sudo certbot certonly --nginx -d api.in-spectra.com -d in-spectra.com -d app.in-spectra.com
sudo certbot renew --dry-run  # Test auto-renewal
```

The SAN certificate issued by the command above lives at `/etc/letsencrypt/live/api.in-spectra.com/` and is reused by api/app/landing vhosts in this guide.

## Testing & Monitoring

### Test API

```bash
# Health check
curl https://api.in-spectra.com/

# Expected response:
# {"status":"ok","message":"In-Spectra API is running"}

# Test tRPC endpoint
curl -X POST https://api.in-spectra.com/api/trpc/auth.login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test"}'

# List clients (tRPC)
curl https://api.in-spectra.com/api/trpc/sites.clients
```

### View Logs

```bash
# Service logs
sudo journalctl -u in-spectra-api -n 100 -f

# Nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# Database logs
sudo tail -f /var/log/postgresql/postgresql.log
```

### Monitor Resources

```bash
# CPU & Memory usage
ps aux | grep "bun backend/server.ts"

# Open connections
sudo lsof -p $(pgrep -f "bun backend/server.ts")

# Nginx connections
sudo netstat -antp | grep nginx
```

## Deployment Updates

### Deploy New Version

```bash
cd /var/www/in-spectra-api
git pull origin main
bun install
sudo systemctl restart in-spectra-api

# Verify
sudo systemctl status in-spectra-api
curl https://api.in-spectra.com/
```

### Rollback

```bash
cd /var/www/in-spectra-api
git revert HEAD
bun install
sudo systemctl restart in-spectra-api
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Port 3100 already in use | `sudo lsof -i :3100` and kill process |
| Nginx 502 Bad Gateway | Check service status: `sudo systemctl status in-spectra-api` |
| Database connection error | Verify `.env` credentials and PostgreSQL is running |
| SSL certificate error | Run `sudo certbot renew --force-renewal` |
| High memory usage | Check for memory leaks: `ps aux \| grep bun` and restart service |

## Security Checklist

- [ ] SSH key-based authentication only (no passwords)
- [ ] Firewall rules configured (ufw or iptables)
- [ ] .env file permissions: `chmod 600 .env`
- [ ] Database backups configured (daily)
- [ ] SSL certificate auto-renewal enabled
- [ ] Rate limiting on Nginx configured
- [ ] Database user has minimal required permissions
- [ ] Regular security updates applied
- [ ] Monitoring & alerting set up
- [ ] Logs stored and rotated

## Support

For issues, check:
1. Service logs: `sudo journalctl -u in-spectra-api -f`
2. Nginx logs: `/var/log/nginx/error.log`
3. Database connectivity: `psql -U api_user -d in_spectra -h localhost`
