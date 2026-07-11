import { describe, expect, it } from 'vitest'

import { createSocialHead } from './seo'

describe('social metadata', () => {
  it('keeps basic metadata available before route data resolves', () => {
    expect(
      createSocialHead({
        description: 'Design together.',
        imageVariant: 'home',
        origin: undefined,
        path: '/',
        title: 'Offset',
      }),
    ).toEqual({
      meta: [
        { title: 'Offset' },
        { name: 'description', content: 'Design together.' },
      ],
      links: [],
    })
  })

  it('builds absolute Open Graph, Twitter, and canonical URLs', () => {
    const head = createSocialHead({
      description: 'Design together.',
      imageVariant: 'home',
      origin: 'https://offset.example',
      path: '/',
      title: 'Offset',
    })

    expect(head.links).toContainEqual({
      rel: 'canonical',
      href: 'https://offset.example/',
    })
    expect(head.meta).toContainEqual({
      property: 'og:image',
      content: 'https://offset.example/api/og?variant=home',
    })
    expect(head.meta).toContainEqual({
      name: 'twitter:card',
      content: 'summary_large_image',
    })
    expect(head.meta).toContainEqual({
      property: 'og:image:width',
      content: '1200',
    })
  })

  it('keeps studio sharing metadata distinct from the landing page', () => {
    const head = createSocialHead({
      description: 'A shared room.',
      imageVariant: 'studio',
      origin: 'https://offset.example',
      path: '/studio/team%20room',
      title: 'Studio — Offset',
    })

    expect(head.meta).toContainEqual({
      property: 'og:url',
      content: 'https://offset.example/studio/team%20room',
    })
    expect(head.meta).toContainEqual({
      name: 'twitter:image',
      content: 'https://offset.example/api/og?variant=studio',
    })
  })
})
