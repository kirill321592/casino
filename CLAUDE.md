# roulette

React 19 + TypeScript + Vite. Tailwind v4, PixiJS for the roulette/slots canvas, react-hook-form for forms, socket.io-client for the live feed. Source follows Feature-Sliced Design: `app` → `pages` → `widgets` → `features` → `entities` → `shared`, imports only ever point down that list.

## Commands

```bash
npm run dev          # vite dev server
npm run build        # tsc -b && vite build
npm run lint         # oxlint
npm run format       # oxfmt
```

Lint and format are oxlint/oxfmt, not ESLint/Prettier.

## UI code

When writing or editing UI code, follow these two skills. Consult them while writing, not only when asked to review.

- `web-interface-guidelines` — accessibility, focus states, forms, animation, typography, copy.
- `vercel-react-best-practices` — React performance: re-renders, bundle size, waterfalls, rendering. Read `SKILL.md` for the rule index, then only the `rules/*.md` files that apply; skip `AGENTS.md` unless a broad audit needs it.

This app is a Vite SPA, so the `server-` rules (RSC, server actions, `after()`) and anything Next.js-specific don't apply.
