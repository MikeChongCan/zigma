import handler from '@tanstack/react-start/server-entry'
import { routePartykitRequest } from 'partyserver'

import { createAuth, isGoogleAuthEnabled } from './auth/server'
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

    if (url.pathname === '/api/auth/config') {
      return Response.json(
        {
          googleEnabled: isGoogleAuthEnabled(env),
          googleCallbackUrl: `${url.origin}/api/auth/callback/google`,
        },
        { headers: { 'Cache-Control': 'no-store' } },
      )
    }

    if (url.pathname.startsWith('/api/auth/')) {
      return createAuth(env, request).handler(request)
    }

    const partyResponse = await routePartykitRequest(request, env, {
      onBeforeConnect: async (upgradeRequest) => {
        const origin = upgradeRequest.headers.get('origin')
        if (
          !origin ||
          new URL(origin).host !== new URL(upgradeRequest.url).host
        ) {
          return new Response('Cross-origin collaboration is not allowed', {
            status: 403,
          })
        }

        const session = await createAuth(env, upgradeRequest).api.getSession({
          headers: upgradeRequest.headers,
        })
        if (!session) {
          return new Response('Sign in to join this canvas', { status: 401 })
        }
      },
    })

    return partyResponse ?? handler.fetch(request)
  },
} satisfies ExportedHandler<Cloudflare.Env>
