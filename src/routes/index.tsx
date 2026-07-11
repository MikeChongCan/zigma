import { createFileRoute } from '@tanstack/react-router'

import { LandingPage } from '#/components/landing/landing-page'
import {
  HOME_DESCRIPTION,
  HOME_TITLE,
  createSocialHead,
  getRequestOrigin,
} from '#/seo'

export const Route = createFileRoute('/')({
  loader: () => getRequestOrigin(),
  head: ({ loaderData }) =>
    createSocialHead({
      title: HOME_TITLE,
      description: HOME_DESCRIPTION,
      origin: loaderData,
      path: '/',
      imageVariant: 'home',
    }),
  component: LandingPage,
})
