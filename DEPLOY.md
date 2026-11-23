# Deploying BgCleaner to a VPS

Runs as three containers behind one domain: **nginx** (public, ports 80/443) → **frontend** (Next.js) and **backend** (FastAPI + AI model). Only Nginx is exposed to the internet.

## 1. Server

- Ubuntu 22.04/24.04, **at least 2 GB RAM** (the AI model needs ~1 GB while processing; 4 GB is comfortable).
- Install Docker: `curl -fsSL https://get.docker.com | sh`
- Point your domain's DNS **A record** to the server's IP.
- Open ports 80 and 443 in the firewall.

## 2. First start (HTTP)

```bash
git clone <your repo> bgcleaner && cd bgcleaner
cp .env.example .env
nano .env            # set PUBLIC_URL=https://yourdomain.com, keep NGINX_CONF=nginx.conf
docker compose up -d --build
```

The first build downloads the AI model into the backend image (~180 MB), so it takes a few minutes.
Check it: `curl http://yourdomain.com/api/v1/health` → `{"status":"ok",...}`

## 3. Enable HTTPS (free, Let's Encrypt)

```bash
docker compose run --rm certbot certonly --webroot -w /var/www/certbot -d yourdomain.com --email you@example.com --agree-tos --no-eff-email
sed -i 's/example.com/yourdomain.com/g' deploy/nginx-https.conf
sed -i 's/^NGINX_CONF=.*/NGINX_CONF=nginx-https.conf/' .env
docker compose up -d nginx
```

Certificates last 90 days. Renew with a monthly cron job:
```bash
0 3 1 * * cd /root/bgcleaner && docker compose run --rm certbot renew && docker compose exec nginx nginx -s reload
```

## Shared server (other sites already running)

If ports 80/443 are already used (check with `sudo ss -tlnp | grep -E ':(80|443) '`), don't do steps 2–3.
BgCleaner runs privately on `127.0.0.1:8080` and your existing web server forwards your domain to it.
The steps below assume the existing web server is **Nginx installed on the host**.

1. Pick a free local port (`sudo ss -tlnp | grep 8080` should print nothing; otherwise use e.g. 8090).
2. Configure and start:
   ```bash
   git clone https://github.com/harnoorkaurludhiana-hub/BgCleaner.git bgcleaner && cd bgcleaner
   cp .env.example .env
   nano .env
   #   PUBLIC_URL=https://yourdomain.com
   #   NGINX_CONF=nginx-behind-proxy.conf
   #   HTTP_PORT=127.0.0.1:8080
   #   HTTPS_PORT=127.0.0.1:8443
   docker compose up -d --build
   curl http://127.0.0.1:8080/api/v1/health
   ```
3. Add a site to the host Nginx, `/etc/nginx/sites-available/bgcleaner`:
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com www.yourdomain.com;

       client_max_body_size 21m;

       location / {
           proxy_pass http://127.0.0.1:8080;
           proxy_set_header Host $host;
           proxy_set_header X-Forwarded-For $remote_addr;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_read_timeout 300s;
           proxy_send_timeout 300s;
       }
   }
   ```
   ```bash
   sudo ln -s /etc/nginx/sites-available/bgcleaner /etc/nginx/sites-enabled/
   sudo nginx -t && sudo systemctl reload nginx
   ```
4. HTTPS with the host's certbot: `sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com`
   (install it first if needed: `sudo apt install certbot python3-certbot-nginx`). Renewal is automatic.

## 4. Operating it

| Task | Command |
|---|---|
| Logs | `docker compose logs -f backend` |
| Update after `git pull` | `docker compose up -d --build` |
| Restart | `docker compose restart` |
| Stop | `docker compose down` (uploaded images are kept in the `storage` volume) |

## Built-in protections

- Uploads: 20 MB max (Nginx + backend), real image content checked, random file names, 8000 px / 25 MP limits.
- Rate limits: 10 background removals per IP per minute (Nginx and backend), 60 API calls per minute.
- Temporary files are deleted after `FILE_RETENTION_HOURS` (default 24) by a cleanup job every 30 minutes.
- Security headers, no API docs in production, backend not reachable except through Nginx.

## Scaling notes

- `MAX_CONCURRENT_JOBS` (default 2) = images processed at the same time. Raise it with more CPU/RAM.
- The rate limiter is in-memory, so keep one backend container. Running several needs a shared store such as Redis.
