# Zigma project guidance

- Use `bun` for package and script commands.
- Run `bun run validate` after implementation changes.
- Regenerate `worker-configuration.d.ts` with `bun run cf-typegen` after changing Cloudflare bindings.
- Keep editor files focused and generally below 500 lines.
- Preserve the DOM-first renderer: React/HTML fidelity is the core product constraint. Use Canvas/WebGL only for effects or dense non-interactive layers.
- Collaboration state belongs in Yjs shared types; presence belongs in awareness state. Do not replace object-level updates with whole-document last-write-wins messages.
- Treat `src/server.ts` and `wrangler.jsonc` as production-sensitive. Keep the same-origin guard and add explicit authorization before private rooms.
