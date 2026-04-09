# Webhook bridge (GitHub → Linear)

This folder contains a tiny HTTP server you can run on your laptop (behind `https://charliehooks.pi.stags.wtf/`) to move Linear issues through the `Merged → Delivered → Accepted` states based on GitHub events.

## Run

1. Copy `./scripts/webhook-bridge/.env.example` and fill in values.
2. Export env vars and start the server:

```
npm run webhook:bridge
```

## Endpoints

All endpoints are `POST` and accept JSON `{ issues: ["CHA-123", ...] }`.

- `/hooks/github/pr-merged` → moves issues to `Merged`
- `/hooks/github/deploy` → moves issues to `Delivered` and (by default) runs post-deploy verification, moving to `Accepted` when checks pass (requires a `charlie-acceptance` block on the issue)
- `/hooks/verify` → run post-deploy verification and (if successful) move to `Accepted`

Requests must include `Authorization: Bearer <secret>`.

## Per-issue acceptance checks

If a Linear issue description contains a `charlie-acceptance` code block, it will be used for verification:

````
```charlie-acceptance
{
  "checks": [
    {
      "type": "http",
      "url": "https://stagswtf.github.io/walkup_music/",
      "status": 200,
      "bodyIncludes": "Walk-Up Music Manager"
    }
  ]
}
```
````
