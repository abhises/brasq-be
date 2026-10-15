# Production deploys

`brasq-be` and `brasq-fe` each have their own pipeline (`.github/workflows/deploy.yml`).

```
push to main ─► build job (GitHub runner)              ─► deploy job (server)
                 npm ci, typecheck                          upload image over SSH
                 docker build                               brasq-release deploy <app> <image>
                 boot the image + /health smoke test          start in the idle slot (blue/green)
                                                              health check ── fail ─► drop it, live release untouched
                 any failure here = nothing deployed          pass ─► nginx switches traffic, old slot stopped
                                                            check https://… through nginx ── fail ─► automatic rollback
```

Pull requests run the build job only.

## Rolling back

- **GitHub:** Actions → **Rollback** → *Run workflow*. Leave the field empty for the previous release, or paste a
  commit SHA (short is fine) to go back to that build. The server keeps the last 6 images per app.
- **Server:** `~/brasq/infra/brasq-release rollback web` (or `api`), `~/brasq/infra/brasq-release rollback web brasq-web:<sha>`.
- `~/brasq/infra/brasq-release status` lists the live slot, recent releases and the images available.

The previous release stays on the server as a stopped container, so a rollback only has to start it and switch
nginx back (a few seconds, no rebuild).

## Server layout (`/home/ubuntu/brasq`)

| Path | What |
|---|---|
| `infra/` | this folder, synced by the brasq-be pipeline (`brasq-release`, `docker-compose.yml`, `nginx.conf`) |
| `env/api.env`, `env/web.env`, `env/db.env` | production secrets and settings (never in git) |
| `state/` | live slot per app and release history |

| Process | Port (localhost only) |
|---|---|
| Postgres (`docker compose`, project `brasq`) | 5434 |
| api blue / green | 4001 / 4002 |
| web blue / green | 3001 / 3002 |
| nginx → live api, for the web containers (`BACKEND_URL`) | 4000 |

nginx (`/etc/nginx/sites-available/brasq`, a copy of `nginx.conf`) serves `brasq.com`, `www` (redirect) and
`api.brasq.com`. The upstreams it proxies to are in `/etc/nginx/conf.d/brasq-{api,web}-upstream.conf`, rewritten
by `brasq-release` on every switch. Changes to `nginx.conf` or `docker-compose.yml` are not applied automatically:
copy them into place and run `sudo nginx -t && sudo systemctl reload nginx` / `docker compose --env-file ../env/db.env up -d`.

Changing a setting: edit `~/brasq/env/<app>.env`, then re-release the live image so it picks it up, e.g.
`~/brasq/infra/brasq-release deploy api "$(docker inspect -f '{{.Config.Image}}' brasq-api-$(cat ~/brasq/state/api.color))"`.

## GitHub secrets (each repo → Settings → Secrets and variables → Actions)

| Secret | Value |
|---|---|
| `DEPLOY_SSH_KEY` | private key of the deploy key (`~/.ssh/brasq_deploy` on the dev machine) |
| `DEPLOY_HOST` | `13.48.57.12` |
| `DEPLOY_KNOWN_HOSTS` | output of `ssh-keyscan -t ed25519 13.48.57.12` |
| `DEPLOY_USER` | optional, defaults to `ubuntu` |

## Database migrations

The api runs `prisma migrate deploy` when it starts, so a new release migrates the database before it takes traffic,
while the old release is still serving. Keep migrations backwards compatible (add columns/tables first, remove them in
a later release) so a rollback still works against the migrated database.
