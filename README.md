# VoltBazar — Netlify trial edition

This is a separate standard Next.js application prepared for Netlify. It does not depend on Cloudflare D1/R2, Vinext or ChatGPT authentication. The earlier Sites package remains available separately.

## Deploy through GitHub and Netlify

1. Extract this ZIP. Create a GitHub repository and upload the extracted project files to its root. `package.json` and `netlify.toml` must be at the repository root, not inside an extra wrapper folder. Do not upload node_modules, .next, .data, .env.local or secrets.
2. Sign in to Netlify. Choose Add new project → Import an existing project → GitHub, then select your repository.
3. Build settings: build command `npm run build`; publish directory `.next`; Node version `22`. Netlify automatically selects its Next.js adapter. The included netlify.toml defines these settings.
4. Add `VOLTB_STORAGE=netlify` in Project configuration → Environment variables, available to builds and functions (all scopes if offered). The database and images use site-wide Netlify Blobs; no external database signup is needed. Local file storage is only for local testing.
5. To enable administrator login, add your own `ADMIN_EMAIL`, `ADMIN_PASSWORD` (12+ characters), and `ADMIN_SESSION_SECRET` (random, 32+ characters). Never put these secrets in the Git repository or send them in chat. Without these variables, /admin is read-only.
6. Deploy. After Netlify gives you the address, add `SITE_ORIGIN=https://your-project.netlify.app` and redeploy. Visit that address and /admin/login.

Netlify supplies Blobs context to supported server functions. If runtime logs report a missing Blobs environment, set NETLIFY_SITE_ID to your project's ID and NETLIFY_BLOBS_TOKEN to an appropriately scoped personal access token in secure function environment settings. Do not expose the token to the browser. Keep the latest supported Netlify Next.js runtime; do not disable its automatic framework adapter. If strong-consistency context is unavailable, the app reports a storage error rather than silently falling back to ephemeral files.

Official deployment reference: https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/
Official storage reference: https://docs.netlify.com/build/data-and-storage/netlify-blobs/

## Run locally in VS Code (Windows PowerShell)

Use Node 22.18 or newer. Open the extracted project folder containing package.json.

```powershell
npm.cmd ci
Copy-Item .env.example .env.local
npm.cmd run dev
```

Copy the example only on a fresh setup. Preserve an existing .env.local. Set VOLTB_STORAGE=local there. Open the localhost URL printed by Next.js, normally http://127.0.0.1:3000. The schema and sample products initialize automatically; no Wrangler commands or migrations are needed.

To enable local admin, set ADMIN_EMAIL, ADMIN_PASSWORD and ADMIN_SESSION_SECRET in .env.local and restart. Generate a session secret with:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Store that output privately as ADMIN_SESSION_SECRET. The server uses signed eight-hour HttpOnly sessions, rate-limited login and checks admin permissions server-side. It does not trust user-supplied identity headers.

## Included functionality

English/Bangla storefront switch and product names, search, categories, price filtering, wishlist, cart, test COD checkout, private receipt links, stock guards, discounts, admin product editing, product image uploads, orders, tracking, store settings and policies. Native Next.js metadata, sitemap and robots routes are present; indexing stays disabled in this trial.

Netlify data storage uses a SQLite snapshot in site-wide Blobs with strong reads and conditional ETag writes. Transactions are retried against the latest snapshot on write conflicts. This is designed for a small trial; it rewrites a database snapshot on each mutation and is not intended as a high-volume production ecommerce database. Local development stores data under .data; that directory is never deployed.

All orders remain test orders. Preview mode cannot be switched off in this edition. SSLCommerz, direct wallet transactions, refunds, real courier booking, email and SMS sends are disabled. Their original workflows remain in the source, but service credentials are deliberately unavailable to the trial runtime. This edition cannot accidentally charge customers or dispatch shipments.

Use fictional contact and delivery details when testing. Replace illustrative sample photos with accurate catalog photos before any real launch. The site's current name can be changed through store settings.

## Validation

Passed TypeScript checking, native Next.js production build and local production HTTP tests covering storefront rendering, cart, idempotent checkout, private receipt access, administrator login, rejection of spoofed identity headers, fulfillment status, order tracking, upload/download and data persistence across a server restart.

The Netlify Blobs SDK adapter was tested against a controlled HTTP mock implementing strong reads and conditional writes, including concurrent independent clients. This is not a live Netlify deployment test. Netlify account deployment and real provider transactions have not been tested. Browser visual QA was unavailable.

```sh
npm run typecheck
npm run build
npm run test:storage
npm run test:http
```

The HTTP test uses its own test admin credentials and writes sample records to the local .data folder. Do not run it against customer data. No credentials, local test database, dependencies or compiled output are included in the ZIP. npm ci installs the locked dependencies; Netlify builds the output itself.
