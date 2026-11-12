# Production deployment

The React app is a static Vite build that calls the existing Spring Boot API. The recommended
topology is **same-origin**: one host serves `dist/` and reverse-proxies `/api/` to Spring Boot.
That keeps `VITE_API_BASE_URL=/api/v1`, avoids browser CORS entirely, and needs no backend
contract change.

Do not publish or change DNS without the owner's approval.

## 1. Build

```bash
cd frontend-react
npm ci
npm run build
```

`dist/` is the only directory to upload. It contains hashed JS/CSS assets and `index.html`; it
contains no API keys, JWTs or backend credentials. `VITE_*` values are public because Vite inlines
them into the bundle. Never put a secret in a `VITE_*` variable.

Set build-time variables in the shell or CI secret store:

| Variable | Production value | Notes |
|---|---|---|
| `VITE_API_BASE_URL` | `/api/v1` | Default. Relative path uses the same-origin proxy. |
| `VITE_PROXY_TARGET` | `http://127.0.0.1:8080` | Used by `npm run dev` / `npm run preview` only. Never shipped as a secret. |

If the app is hosted under a subpath (for example `/fusionv/`), set Vite's `base` option in
`vite.config.js` and use `VITE_API_BASE_URL=/fusionv/api/v1` with a matching proxy. The current
default assumes the domain root.

## 2. Nginx (recommended)

Terminate TLS at Nginx (or a load balancer in front of it). Keep Spring Boot bound to loopback.

```nginx
server {
    listen 443 ssl http2;
    server_name fusionv.example.com;

    ssl_certificate     /etc/letsencrypt/live/fusionv.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/fusionv.example.com/privkey.pem;

    root /srv/fusionv/frontend-react/dist;
    index index.html;

    # SPA fallback: /teams, /profile, /resources/123 all return index.html.
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Long-cache fingerprint-bearing assets; never cache index.html.
    location /assets/ {
        try_files $uri =404;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
    location = /index.html {
        add_header Cache-Control "no-cache";
    }

    # Same-origin API proxy. Strip the browser Origin header because this is now
    # a server-to-server request; the backend CORS allowlist stays unchanged.
    location /api/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Origin "";
        client_max_body_size 12m;  # uploads: 10 MB files + multipart overhead
    }

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

## 3. Caddy alternative

```caddyfile
fusionv.example.com {
    root * /srv/fusionv/frontend-react/dist
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

Caddy provisions and renews TLS automatically when DNS points at the host.

The CSP assumes the recommended same-origin `/api` proxy. If you deliberately use an absolute
`VITE_API_BASE_URL`, add that API origin to `connect-src`. `style-src 'unsafe-inline'` is required
by React/motion inline style attributes; do not add `unsafe-inline` to `script-src`. Enable HSTS
only after every subdomain is HTTPS-ready.

## 4. Other static hosts

The required behavior is always the same:

- serve `index.html` for unknown non-file paths (SPA fallback);
- proxy `/api/*` to Spring Boot on the same origin;
- serve `/assets/*` with a long immutable cache and `index.html` with `no-cache`;
- terminate HTTPS and redirect HTTP to it.

Examples:

- **Netlify:** `public/_redirects` with `/api/* https://api.internal.example/:splat 200` and
  `/* /index.html 200`.
- **Vercel:** a rewrite of `/api/:path*` to the backend plus a catch-all rewrite to `/index.html`.
- **Cloudflare Pages:** a Worker or `_redirects` rule for the API and an SPA fallback.

Do not deploy the app to a host that cannot proxy the API on the same origin unless you also
update the backend CORS allowlist and set `VITE_API_BASE_URL` to that absolute API origin.

## 5. Verification after deployment

These are checks for the owner to run after authorizing a deployment:

1. `GET /` returns the built HTML and `/assets/*.js` returns JavaScript with a 200.
2. A deep link such as `/teams/1` returns the SPA, not a 404.
3. Sign in, refresh, protected navigation, logout and remember-me behave as in `npm run preview`.
4. `GET /api/v1/hackathons` returns JSON through the same origin; no request goes to
   `localhost:8080` in the browser.
5. Upload a resource and a resume, then download both; check the proxy body limit.
6. Check the browser console for mixed-content or CORS errors.
7. Apply security headers and confirm the site is HTTPS-only.

## 6. Environment and secret rules

- Keep `.env`, `.env.local` and `.dev.vars` out of version control.
- `VITE_API_BASE_URL` and `VITE_PROXY_TARGET` are the only frontend environment variables. They are
  not secrets.
- JWTs live in browser storage by design (matching the legacy app) and are not in the build.
- Backend secrets, database credentials and file storage belong to the Spring Boot deployment and
  are outside this frontend repository.
