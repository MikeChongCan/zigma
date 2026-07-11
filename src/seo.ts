import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'

export const SITE_NAME = 'Offset'
export const HOME_TITLE = 'Offset — Infinite canvas for React interfaces'
export const HOME_DESCRIPTION =
  'Design live React and HTML interfaces on an infinite multiplayer canvas with layers, inspection, and edge persistence.'
export const STUDIO_TITLE = 'Studio — Offset'
export const STUDIO_DESCRIPTION =
  'A collaborative infinite canvas for live React and HTML designs.'

export const getRequestOrigin = createServerFn({ method: 'GET' }).handler(
  () => new URL(getRequest().url).origin,
)

type SocialHeadOptions = {
  description: string
  imageVariant: 'home' | 'studio'
  origin?: string
  path: string
  title: string
}

export function createSocialHead({
  description,
  imageVariant,
  origin,
  path,
  title,
}: SocialHeadOptions) {
  if (!origin) {
    return {
      meta: [{ title }, { name: 'description', content: description }],
      links: [],
    }
  }

  const pageUrl = new URL(path, origin).toString()
  const imageUrl = new URL('/api/og', origin)
  imageUrl.searchParams.set('variant', imageVariant)
  const imageAlt =
    imageVariant === 'studio'
      ? 'Offset collaborative canvas workspace preview'
      : 'Offset infinite canvas product preview'

  return {
    meta: [
      { title },
      { name: 'description', content: description },
      { property: 'og:type', content: 'website' },
      { property: 'og:site_name', content: SITE_NAME },
      { property: 'og:locale', content: 'en_US' },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:url', content: pageUrl },
      { property: 'og:image', content: imageUrl.toString() },
      { property: 'og:image:secure_url', content: imageUrl.toString() },
      { property: 'og:image:type', content: 'image/png' },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
      { property: 'og:image:alt', content: imageAlt },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: imageUrl.toString() },
      { name: 'twitter:image:alt', content: imageAlt },
    ],
    links: [{ rel: 'canonical', href: pageUrl }],
  }
}
