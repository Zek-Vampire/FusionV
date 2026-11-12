# FusionV Frontend Deployment

The FusionV React application is a static Vite build that communicates with the existing Spring Boot backend through REST APIs.

The recommended production architecture uses a **same-origin deployment**: one web server serves the frontend build and reverse-proxies `/api/` requests to the Spring Boot backend.

This approach keeps `VITE_API_BASE_URL=/api/v1`, avoids browser CORS issues, and does not require changes to the backend API contract.

**Do not publish the application or change DNS without the owner's approval.**

## 1. Build the Frontend

From the project root:

```bash
cd frontend
npm ci
npm run build
```

The production build is generated in:

```text
frontend/dist/
```

The `dist/` directory contains the static HTML, JavaScript and CSS assets required to serve the frontend.

Only the generated `dist/` directory needs to be deployed to the frontend web server.

### Environment Variables

Configure build-time variables through the shell or deployment environment.

| Variable | Production Value | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `/api/v1` | Relative API path used by the same-origin proxy |
| `VITE_PROXY_TARGET` | `http://127.0.0.1:8080` | Development and preview proxy target |

**Security note:** Vite exposes `VITE_*` variables in the generated frontend bundle. Never store passwords, API secrets, database credentials or JWT signing keys in these variables.

The default configuration assumes the application is hosted at the domain root.

If the application is hosted under a subpath, such as `/fusionv/`, configure Vite's `base` option and use a matching API path and proxy configuration.

## 2. Nginx Deployment (Recommended)

Nginx can serve the React build and forward API requests to the Spring Boot backend.

Recommended architecture:

```text
Browser
   |
   v
Nginx (HTTPS)
   |
   |---- Frontend static files
   |
   |---- /api/* requests
                |
                v
          Spring Boot
          Port 8080
                |
                v
            PostgreSQL
```

Terminate TLS at Nginx or at a load balancer in front of it. Keep Spring Boot bound to loopback or otherwise protected from direct public access.

Example Nginx configuration:

```nginx
server {
    listen 443 ssl http2;
    server_name fusionv.example.com;

    ssl_certificate     /etc/letsencrypt/live/fusionv.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/fusionv.example.com/privkey.pem;

    root /srv/fusionv/frontend/dist;
    index index.html;

    # React single-page application fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache fingerprinted assets
    location /assets/ {
        try_files $uri =404;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # Do not cache the application entry point
    location = /index.html {
        add_header Cache-Control "no-cache";
    }

    # Same-origin API reverse proxy
    location /api/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Origin "";

        # Supports uploads up to 10 MB plus multipart overhead
        client_max_body_size 12m;
    }

    # Security headers
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header X-Frame-Options "DENY" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'" always;
}

server {
    listen 80;
    server_name fusionv.example.com;
    return 301 https://$host$request_uri;
}
```

Replace the example domain and certificate paths with the actual production values before using this configuration.

## 3. Caddy Deployment Alternative

Caddy is another option for serving the frontend and reverse-proxying API requests.

Example Caddy configuration:

```caddyfile
fusionv.example.com {
    root * /srv/fusionv/frontend/dist
    encode gzip zstd

    @api path /api/*
    reverse_proxy @api 127.0.0.1:8080 {
        header_up Origin ""
    }

    try_files {path} /index.html
    file_server

    header {
        X-Content-Type-Options nosniff
        Referrer-Policy strict-origin-when-cross-origin
        X-Frame-Options DENY
        Strict-Transport-Security "max-age=31536000; includeSubDomains"
        Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'"
        -Server
    }
}
```

Caddy can automatically provision and renew TLS certificates when DNS is correctly configured.

### Content Security Policy Notes

The example Content Security Policy assumes the recommended same-origin API proxy.

If an absolute `VITE_API_BASE_URL` is used, add the API origin to `connect-src`.

The inline style allowance supports the application's inline styling and animation behavior. Avoid adding `unsafe-inline` to `script-src`.

Enable HSTS with `includeSubDomains` only when every affected subdomain is HTTPS-ready.

## 4. Other Static Hosting Providers

The same deployment requirements apply to other hosting providers:

- Serve `index.html` for unknown frontend routes.
- Reverse-proxy `/api/*` requests to Spring Boot.
- Cache fingerprinted assets for long periods.
- Avoid caching `index.html`.
- Enable HTTPS and redirect HTTP traffic to HTTPS.

Possible hosting options include:

| Platform | Deployment Approach |
|---|---|
| Netlify | Static hosting with redirects or proxy configuration |
| Vercel | Static deployment with API rewrites |
| Cloudflare Pages | Static hosting with Workers or redirect configuration |

If the hosting provider cannot proxy API requests on the same origin, configure the backend CORS allowlist and use an absolute `VITE_API_BASE_URL` pointing to the API server.

## 5. Post-Deployment Verification

After an authorized deployment, verify the following:

1. The application homepage loads successfully.
2. JavaScript and CSS assets return HTTP 200.
3. Direct navigation to routes such as `/teams` or `/profile` loads the React application instead of returning a 404.
4. Registration and login work correctly.
5. Refreshing authenticated pages behaves correctly.
6. Protected API requests include the JWT authorization header.
7. `GET /api/v1/hackathons` returns JSON through the same origin.
8. API requests do not unexpectedly target `localhost:8080` from the production browser.
9. Resource and resume uploads work correctly.
10. Resource and resume downloads work correctly.
11. The browser console has no mixed-content or CORS errors.
12. HTTPS and security headers are configured correctly.

These checks should be performed only after deployment has been approved.

## 6. Environment and Security Rules

- Never commit `.env`, `.env.local` or `.dev.vars`.
- Never place secrets in `VITE_*` variables.
- Keep database credentials and JWT signing secrets in the backend deployment environment.
- Keep uploaded files outside the public frontend build.
- Use HTTPS for production traffic.
- Configure appropriate CORS and reverse-proxy settings.
- Restrict direct public access to the backend where possible.
- Review security headers and file upload limits before production release.

JWTs are stored in browser storage by the current application design. They are not embedded as fixed credentials in the production build.

## Related Documentation

- `../README.md` — Main FusionV project documentation.
- `../backend/README.md` — Backend setup and architecture.
- `../backend/API_DOCUMENTATION.md` — REST API reference.
- `../backend/FRONTEND_INTEGRATION.md` — Frontend and backend integration.
