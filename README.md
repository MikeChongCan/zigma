# Offset

Offset is an infinite canvas for designing live HTML and React interfaces. It combines a DOM-first renderer, nested layers, a property inspector, undo/redo, and Yjs-based multiplayer rooms persisted by Cloudflare Durable Objects.

## What is included

- TanStack Start + React 19 + Vite 8
- Cloudflare Workers deployment through the official Vite plugin
- Infinite pan/zoom canvas with grid snapping
- Nested frames and live DOM design primitives
- Layers, visibility, locking, ordering, multi-select, duplicate, and delete
- Selection-aware right-click menus with bulk hierarchy and layer actions
- Transform, appearance, content, and typography inspection
- Gesture-aware undo/redo history
- Yjs collaborative document synchronization
- Live cursors and selections through Yjs awareness
- Durable Object snapshots with hibernating PartyServer WebSockets
- Responsive product landing page and `/studio/$documentId` rooms
- Edge-rendered Open Graph images and complete Twitter card metadata
- Unit tests for geometry, history, hierarchy, and Yjs serialization

## Renderer choice

The editor uses the browser DOM as its scene renderer. The product is intended to edit React and HTML, so native layout, typography, accessibility, and content editing are more valuable than rasterizing every node into Canvas 2D or WebGL. GPU-backed rendering can still be added later for effects, previews, or extremely dense primitive layers without changing the document model.

The experimental HTML-in-Canvas API is deliberately not required. It is useful as a future acceleration path, but it is not yet a safe cross-browser foundation.

## Local development

```bash
bun install
bun run cf-typegen
bun run dev
```

Open `http://localhost:3000` for the landing page or `http://localhost:3000/studio/demo` for the editor.

The Cloudflare Vite plugin runs the Worker and Durable Object locally, so opening the same room in two browser windows exercises real collaboration.

## Validation

```bash
bun run validate
```

The validation pipeline runs formatting checks, ESLint, Vitest, TypeScript, and the production build. Individual commands are also available:

```bash
bun run check
bun run lint
bun run test
bun run typecheck
bun run build
```

## Cloudflare deployment

Authenticate once, then deploy:

```bash
bunx wrangler login
bun run deploy
```

`wrangler.jsonc` includes:

- the custom TanStack Start Worker entrypoint at `src/server.ts`
- a `CanvasRoom` Durable Object binding
- a SQLite-backed Durable Object migration
- Worker observability

After changing bindings, regenerate types:

```bash
bun run cf-typegen
```

The deployment health endpoint is `/api/health`.

Social previews are rendered as 1200×630 PNGs at `/api/og`. The landing page
and studio routes emit absolute Open Graph, Twitter card, and canonical metadata
using the current request origin, so previews work on local, preview, and custom
Cloudflare domains without a hard-coded production URL.

## Collaboration architecture

Each URL room (`/studio/:documentId`) maps to one `CanvasRoom` Durable Object. The browser stores nodes as nested Yjs maps, with individual node and style fields represented as shared values. This avoids whole-document last-write-wins behavior when collaborators edit different properties.

The server periodically persists a compact Yjs state update into Durable Object storage and restores it after eviction. Awareness state carries cursors and selections but is intentionally ephemeral.

## Production notes

The current room model is intentionally link-accessible and enforces same-origin WebSocket connections. Before using it for private customer documents, add authentication and room authorization in `routePartykitRequest(..., { onBeforeConnect })`, then validate the same identity on HTTP document operations. Do not treat unguessable room IDs as authorization.

For larger scenes, the next performance step is viewport culling of offscreen DOM nodes. The current renderer keeps the implementation clear and fully interactive for the included product-scale document.
