# HourCap
Local-first work-time tracker PWA (React 19 + TSX + Tailwind 4 + MUI + Dexie).

    npm install && npm run dev      # dev
    npm test                        # calculation unit tests
    npm run build && npm run preview

Layers: UI → features/pages → hooks → services → repositories → Dexie (`src/db`).
Before deploying, replace `https://hourcap.app` in `index.html`, `src/components/common/useSeo.ts`, `public/robots.txt`, `public/sitemap.xml`, `public/llms.txt`. Serve with SPA fallback to `/index.html`.
