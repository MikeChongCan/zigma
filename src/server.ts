import handler from '@tanstack/react-start/server-entry'
import { routePartykitRequest } from 'partyserver'

import { renderOgImage } from './og-image'

export { CanvasRoom } from './workers/canvas-room'

export default {
  async fetch(request: Request, env: Cloudflare.Env): Promise<Response> {
    const url = new URL(request.url)

    if (url.pathname === '/api/health') {
      return Response.json({
        ok: true,
        service: 'canvas-pro',
        collaboration: 'durable-object',
      })
    }

    if (url.pathname === '/api/og') {
      return renderOgImage(request)
    }

    const partyResponse = await routePartykitRequest(request, env, {
      onBeforeConnect: (upgradeRequest) => {
        const origin = upgradeRequest.headers.get('origin')
        if (
          origin &&
          new URL(origin).host !== new URL(upgradeRequest.url).host
        ) {
          return new Response('Cross-origin collaboration is not allowed', {
            status: 403,
          })
        }
      },
    })

    return partyResponse ?? handler.fetch(request)
  },
} satisfies ExportedHandler<Cloudflare.Env>
