## Reference: Serve SPA with strong security headers

Example minimal Express reverse proxy to serve `dist/` and inject headers beyond what GitHub Pages supports.

```ts
import express from 'express';
import helmet from 'helmet';
import path from 'node:path';

const app = express();

// Helmet presets
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "default-src": ["'self'"],
        "script-src": ["'self'", 'https://sdk.scdn.co'],
        "connect-src": ["'self'", 'https://api.spotify.com', 'https://accounts.spotify.com'],
        "style-src": ["'self'"],
        "img-src": ["'self'", 'data:', 'https://i.scdn.co'],
        "font-src": ["'self'", 'data:'],
        "media-src": ["'self'", 'https://p.scdn.co'],
        "frame-ancestors": ["'none'"],
        "base-uri": ["'self'"],
        "form-action": ["'self'"],
      },
    },
    referrerPolicy: { policy: 'no-referrer' },
    frameguard: { action: 'deny' },
    xssFilter: true,
    noSniff: true,
    hsts: { maxAge: 15552000, includeSubDomains: true, preload: false },
  })
);

const dist = path.join(process.cwd(), 'dist');
app.use(express.static(dist));

// Single Page App fallback
app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on http://localhost:${port}`));
```

Notes:
- Compare with GH Pages: you cannot set HTTP response headers; you must rely on `<meta http-equiv>` CSP which we configured in `index.html`.
- Consider platforms like Cloudflare Pages/Workers, Netlify, or Fly.io to set headers at the edge if you need stricter policies.

