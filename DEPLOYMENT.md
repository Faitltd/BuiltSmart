# BuildSmart Production Deployment Guide

## Prerequisites
- Hetzner server with Ubuntu 22.04
- Docker installed
- Nginx installed
- Domain: buildsmart.itsfait.com configured

## Initial Setup

### 1. Server Setup
```bash
# SSH into Hetzner server
ssh root@your-server-ip

# Update system
apt-get update && apt-get upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh

# Install Nginx
apt-get install nginx -y

# Install Certbot for SSL
apt-get install certbot python3-certbot-nginx -y
```

### 2. Clone Repository
```bash
cd /var/www
git clone https://github.com/Faitltd/BuiltSmart.git
cd BuiltSmart
```

### 3. Configure Nginx Reverse Proxy
Create `/etc/nginx/sites-available/buildsmart.itsfait.com`:

```nginx
server {
    listen 80;
    server_name buildsmart.itsfait.com;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable site:
```bash
ln -s /etc/nginx/sites-available/buildsmart.itsfait.com /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

### 4. Setup SSL
```bash
certbot --nginx -d buildsmart.itsfait.com
```

### 5. Deploy
```bash
cd /var/www/BuiltSmart
./deploy.sh
```

## DNS Configuration

Add these records to your DNS provider:

```
Type: A
Name: buildsmart
Value: [Your Hetzner Server IP]
TTL: 3600
```

## Supabase Configuration

### CORS Settings
In Supabase Dashboard → Settings → API → CORS:
- Add: `https://buildsmart.itsfait.com`

### Site URL
In Supabase Dashboard → Authentication → URL Configuration:
- Site URL: `https://buildsmart.itsfait.com`
- Redirect URLs: `https://buildsmart.itsfait.com/**`

## Monitoring
- `docker ps`, `docker logs buildsmart --tail 200` to confirm the container is healthy.
- `nginx -t` and `systemctl status nginx` to verify the reverse proxy.
- Supabase Dashboard → Logs → API for request errors and RLS issues.
