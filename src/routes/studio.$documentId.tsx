import { createFileRoute } from '@tanstack/react-router'

import { EditorApp } from '#/components/editor/editor-app'
import {
  STUDIO_DESCRIPTION,
  STUDIO_TITLE,
  createSocialHead,
  getRequestOrigin,
} from '#/seo'

export const Route = createFileRoute('/studio/$documentId')({
  loader: () => getRequestOrigin(),
  head: ({ loaderData, params }) => {
    const socialHead = createSocialHead({
      title: STUDIO_TITLE,
      description: STUDIO_DESCRIPTION,
      origin: loaderData,
      path: `/studio/${encodeURIComponent(params.documentId)}`,
      imageVariant: 'studio',
    })

    return {
      ...socialHead,
      meta: [
        ...socialHead.meta,
        { name: 'robots', content: 'noindex, nofollow' },
      ],
    }
  },
  component: StudioRoute,
})

function StudioRoute() {
  const { documentId } = Route.useParams()
  return <EditorApp documentId={documentId} />
}
