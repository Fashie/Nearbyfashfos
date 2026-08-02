# Fashfos Landing Page (Nearby)

Landing/marketing page for the Nearby app, styled to match the app's own design system
(NEARBY_DESIGN_SYSTEM.md: emerald/blue/coral palette, Inter font, rounded cards, soft shadows).

## Run locally
```
npm install
npm run dev
```

## Build
```
npm run build
```
Output goes to `dist/`.

## Deploy on Netlify (new site, separate from the app)
1. Push this folder to its own GitHub repo (recommended) or drag-and-drop the `dist/` folder
   into Netlify after running `npm run build`.
2. In Netlify: "Add new site" → connect this repo.
   - Build command: `npm run build`
   - Publish directory: `dist`
3. Once deployed, go to Site settings → Domain management → Add a domain → enter `fashfos.com`.
   Netlify will show you the DNS records to set (an A record / ALIAS for the apex, or use
   Netlify DNS if the domain's nameservers already point to Netlify).
4. Also add `www.fashfos.com` and redirect it to the apex if you want both to work.

## Pointing nearby.fashfos.com at the existing Nearby app
The Nearby app is already deployed as its own Netlify site. To attach the subdomain to it
WITHOUT touching this landing page site:
1. Go to the **Nearby app's** Netlify site → Domain management → Add domain alias →
   enter `nearby.fashfos.com`.
2. Netlify will tell you to add a CNAME record: `nearby` → `<the-app-site-name>.netlify.app`
   (or an ALIAS if your DNS provider needs it).
3. Add that CNAME in your DNS provider (or in Netlify DNS if fashfos.com's nameservers
   already point there).
4. Wait for DNS propagation (usually minutes, can take up to a few hours), then Netlify
   will auto-provision SSL for `nearby.fashfos.com`.

This keeps two independent Netlify sites:
- `fashfos.com` → this landing page repo
- `nearby.fashfos.com` → the existing Nearby app repo (unchanged)

The CTA buttons on this landing page already point to `https://nearby.fashfos.com`.
