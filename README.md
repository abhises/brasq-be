# brasq-be

Express 5 + Prisma 7 API for BrasQ. Postgres runs in Docker (`docker-compose.yml`, host port **5434**).

```bash
cp .env.example .env
npm install
npm run db:up            # start Postgres
npm run db:migrate       # prisma migrate dev (create/apply migrations)
npm run db:seed          # WARNING: replaces all posts, categories and authors with the demo content
npm run dev              # http://localhost:4000
```

Production-style container: `docker compose --profile api up -d --build` (runs `prisma migrate deploy` on start).

Schema: `prisma/schema.prisma` (Category, Author, Post, Media, Subscriber). After changing it, run `npm run db:migrate`.

## Auth

- `POST /api/auth/login {email, password}` → `{ token }` (JWT, 7 days). Credentials come from `ADMIN_EMAIL` / `ADMIN_PASSWORD`.
- All `/api/admin/*` routes accept `Authorization: Bearer <jwt>` **or** `Authorization: Bearer <API_TOKEN>`.

## API

Public (no auth): `GET /api/public/home`, `/site`, `/posts?type=&category=&author=`, `/posts/:type/:slug`
(`?preview=1` with auth shows drafts), `/categories/:slug`, `/authors`, `/authors/:slug`, `/search?q=`, `/sitemap`,
`POST /api/public/subscribe {email, source}`.

Admin:

```
GET    /api/admin/posts?type=&status=&q=
GET    /api/admin/posts/:id
POST   /api/admin/posts                       create
PATCH  /api/admin/posts/:id                   update (any subset of fields)
PUT    /api/admin/posts/by-slug/:type/:slug   create or update — best for automation
DELETE /api/admin/posts/:id
GET|POST|PATCH|DELETE /api/admin/categories[/:id]
GET|POST|PATCH|DELETE /api/admin/authors[/:id]
GET    /api/admin/media
POST   /api/admin/media          multipart: file, alt
POST   /api/admin/media/import   JSON: { url, alt } — downloads a remote image and stores it
PATCH  /api/admin/media/:id      { alt }
DELETE /api/admin/media/:id
GET    /api/admin/subscribers[?format=csv]
```

Post fields: `type` (guide|review|page), `status` (draft|published), `slug`, `title`, `excerpt`, `html`, `css`,
`coverImage`, `seoTitle`, `seoDescription`, `jsonLd`, `testedCount`, `testWeeks`, `topPick`,
`stickyBar` ({name, score, price, shop, url, image} or null), `newsletterPopup`, `featured` (home hero),
`categoryId`/`categorySlug`, `authorId`/`authorSlug`, `publishedAt`.

Example (Claude or any script):

```bash
curl -X PUT http://localhost:4000/api/admin/posts/by-slug/guide/best-air-purifier \
  -H "Authorization: Bearer $API_TOKEN" -H "Content-Type: application/json" \
  -d '{"title":"The best air purifier of 2026","status":"draft","categorySlug":"home","authorSlug":"sarah-miller","html":"<article class=\"bq-article\">…</article>"}'
```

## Storage

`src/lib/storage/` has a `local` driver (writes to `UPLOAD_DIR`, served at `PUBLIC_URL/uploads/...`) and an `s3` driver
(`S3_BUCKET`, `S3_REGION`, `S3_PUBLIC_URL`, `S3_PREFIX`; credentials from the standard AWS chain). The bucket or CDN must
allow public reads of the uploaded objects. Each media row records which driver stored it.
