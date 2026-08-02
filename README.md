# Fashfos monorepo — all three apps, one folder

```
fashfos-monorepo/
  landing/       -> fashfos.com/          (merges referral into dist/referralgames at build time)
  referral/      -> fashfos.com/referralgames/  (built with base "/referralgames/", never deployed on its own)
  nearby-app/    -> nearby.fashfos.com/   (the actual Nearby social app)
```

One GitHub repo, but this needs **two separate Netlify sites** pointed at it, because
`fashfos.com` and `nearby.fashfos.com` are different domains and Netlify sites each
serve one domain. Both sites can watch the *same* repo — you just set a different
"Base directory" on each.

## Site 1 — Landing + Referral (fashfos.com)
Netlify site settings:
- Base directory: `landing`
- Build command: (auto-detected from `landing/netlify.toml`)
- Publish directory: `landing/dist`
- Custom domain: `fashfos.com`

This build installs and builds `referral/` too, then copies its output into
`landing/dist/referralgames/` — so one deploy serves both.

## Site 2 — Nearby app (nearby.fashfos.com)
Netlify site settings:
- Base directory: `nearby-app`
- Build command: (auto-detected from `nearby-app/netlify.toml`)
- Publish directory: `nearby-app/dist`
- Custom domain (alias): `nearby.fashfos.com`

### Important limitation on the Nearby app
The original project also ships an Express server (`server.ts`) that powers the
"My AI" Gemini chatbot endpoint (`/api/my-ai/chat`). Netlify hosts static files
and serverless functions, not a persistent Express server — so `npm run build`'s
server bundling step is skipped here, and that chat endpoint will NOT work as-is
once deployed to Netlify. Everything else (radar, chat between real users, maps,
profiles) is a normal client app and works fine.

If you want the AI chatbot working in production, that logic needs to be ported
into a Netlify serverless function (`netlify/functions/my-ai-chat.ts`) — happy to
do that conversion if you want it; just say the word.

## Google Map fix
Already applied directly inside `nearby-app/src/features/maps/components/GoogleMapIntegration.tsx`:
brand emerald (#0F8A5F) replacing the old cyan (#00AFEF), coral "Meet Up" button,
20px search card radius, brand-tinted park tiles, ShieldCheck icon on the safety pill.

## Referral section on landing page
`landing/src/App.tsx` now includes:
- "Referral" link in the desktop + mobile nav (scrolls to an on-page section)
- A "Bring friends, earn rewards" section explaining how referral works
- A CTA button in that section linking to `/referralgames/`
- A "Referral" link in the footer too

## Pushing to the official GitHub account
```powershell
git clone https://github.com/<official-account>/<repo-name>.git
cd <repo-name>
Get-ChildItem -Force | Where-Object { $_.Name -ne ".git" } | Remove-Item -Recurse -Force
Copy-Item -Path "C:\path\to\unzipped\fashfos-monorepo\*" -Destination "." -Recurse -Force
git add -A
git commit -m "Add all three apps: landing, referral, nearby-app"
git push origin main
```
