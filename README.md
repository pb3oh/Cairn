# Cairn

> A trail of markers through the Medicare maze. Independent benefits guidance for U.S. retirees.

A working prototype of a benefits-review web product for older adults navigating Medicare, state pharmaceutical assistance programs, property tax credits, VA pension, and other federal and state benefits.

## What this is

A 4-minute interactive review that:

- Asks 11 plain-English questions
- Runs the answers against 14+ federal, state, and county program eligibility rules
- Returns a personalized report with apply links, county-specific tax supplements, and Medigap carrier comparisons
- Offers self-serve printable guides ($19–79) and an optional consultation upsell ($295)

Eight states are seeded with detailed program data (MD, CA, NY, FL, TX, PA, VA, DC). The other 42 fall back to federal-program coverage with a clear "state-specific data coming soon" note.

## Run locally

Requires Node 18+ and npm.

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Deploy to GitHub Pages (free, ~5 minutes)

There are two ways: automated via GitHub Actions (recommended) or manual via the `gh-pages` package.

### Option A — Automated (GitHub Actions, recommended)

1. **Create a new GitHub repo.** Push the contents of this folder to it. The repo can be public or private (Pages works on free private repos as of late 2024).

2. **Update `vite.config.js`** so the `base` path matches your repo name. If your repo URL is `github.com/yourname/cairn-prototype`, the base is `/cairn-prototype/` (already set). If you fork or rename, change it accordingly. If you deploy to `<username>.github.io` or a custom domain, set `base: "/"`.

3. **Enable GitHub Pages** in your repo:
   - Go to **Settings → Pages**
   - Under **Source**, select **GitHub Actions**

4. **Push to `main`.** The workflow in `.github/workflows/deploy.yml` runs automatically. It will:
   - Install dependencies
   - Build the site
   - Publish to GitHub Pages

5. **Wait ~2 minutes**, then visit `https://yourname.github.io/cairn-prototype/`.

Future pushes to `main` redeploy automatically. You can also trigger a deploy manually from the **Actions** tab → **Deploy to GitHub Pages** → **Run workflow**.

### Option B — Manual (gh-pages CLI)

```bash
npm install
npm run deploy
```

This runs `vite build` and pushes the `dist/` folder to a `gh-pages` branch. Then in **Settings → Pages**, set **Source** to **Deploy from a branch** → **gh-pages** / **(root)**.

## Customizing

### Change the brand name

The brand is "Cairn." Search-and-replace in `src/BenefitsAudit.jsx` if you'd rather call it something else. The wordmark icon is rendered as inline SVG (stacked stones) — also editable in that file.

### Add more states

Open `src/BenefitsAudit.jsx` and find the `STATE_DATA` object. Each state entry contains:

- `name`, `seeded` flag
- `mspApplyUrl`, `snapApplyUrl`, `shipUrl` (state agency URLs)
- `medigapCarriers` array with state-specific rate ranges
- `programs` array with eligibility predicates and apply URLs

Copy any seeded state's structure, swap in your own data, add the state code to the dropdown, and the engine handles the rest.

### Add more counties

The `COUNTY_DATA` object maps ZIP-code prefixes to counties with property-tax-supplement details. Production deployments should replace the hand-curated prefix lists with the [HUD USPS ZIP–County crosswalk](https://www.huduser.gov/apps/public/uspscrosswalk/home) (~41,000 rows, free, refreshed quarterly).

### Update annual thresholds

Federal Poverty Level, Medicare premiums, and program income limits update each January. Edit:

- `FPL_2026` constant
- `THRESHOLDS` constant
- Per-state program `eligible` predicates if state thresholds change

## What's prototype-only

The following are simulated client-side and would need a backend in production:

- **Payment processing** — currently a demo form with a clear "no real charge" notice. Production needs Stripe (or similar) with a server-side secret key.
- **Email delivery** — confirmation emails are not sent. Production needs SendGrid, Resend, or Postmark with a transactional template.
- **PDF generation** — guides are generated client-side as proof-of-concept. Production should pre-generate and watermark per purchase, hosted on S3 with signed URLs.
- **Persistent state** — answers and cart reset on refresh. Production needs accounts and order history.

The architecture supports adding all of these without restructuring the front-end.

## Tech stack

- React 18
- Vite (build tool)
- lucide-react (icons)
- Pure inline styles (no framework, no global CSS, easy to fork)
- Newsreader serif (Google Fonts) for display, Inter Tight for body, Cormorant Garamond for the wordmark

No external API calls. No tracking. Works fully offline once loaded.

## License

Treat this as a starting point for your own product, or use it as a reference design. Not affiliated with or endorsed by Medicare, the Centers for Medicare & Medicaid Services, or any government agency.

## Disclaimer

This prototype provides preliminary eligibility estimates only and is not a guarantee of benefits. Income and asset thresholds change annually. Always confirm details with the listed agencies before making decisions.
