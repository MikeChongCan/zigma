import { drizzleAdapter } from '@better-auth/drizzle-adapter'
import { APIError } from 'better-auth/api'
import { betterAuth } from 'better-auth/minimal'
import { anonymous } from 'better-auth/plugins'
import { drizzle } from 'drizzle-orm/d1'

import { authSchema } from '#/db/schema'

import { readDisplayNameHeader } from './identity'

export type AuthEnv = {
  AUTH_DB: D1Database
  BETTER_AUTH_SECRET: string
  GOOGLE_CLIENT_ID?: string
  GOOGLE_CLIENT_SECRET?: string
}

export function isGoogleAuthEnabled(env: AuthEnv): boolean {
  return Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET)
}

export function createAuth(env: AuthEnv, request: Request) {
  const secret = env.BETTER_AUTH_SECRET
  if (!secret || secret.length < 32) {
    throw new Error('BETTER_AUTH_SECRET must be at least 32 characters')
  }

  const origin = new URL(request.url).origin
  const googleEnabled = isGoogleAuthEnabled(env)
  const db = drizzle(env.AUTH_DB, { schema: authSchema })

  return betterAuth({
    appName: 'Offset',
    baseURL: origin,
    secret,
    database: drizzleAdapter(db, {
      provider: 'sqlite',
      schema: authSchema,
      transaction: false,
    }),
    trustedOrigins: [origin],
    socialProviders: googleEnabled
      ? {
          google: {
            clientId: env.GOOGLE_CLIENT_ID!,
            clientSecret: env.GOOGLE_CLIENT_SECRET!,
          },
        }
      : {},
    account: {
      encryptOAuthTokens: true,
      accountLinking: {
        enabled: true,
        trustedProviders: ['google'],
        updateUserInfoOnLink: true,
      },
    },
    session: {
      expiresIn: 60 * 60 * 24 * 30,
      updateAge: 60 * 60 * 24,
      cookieCache: {
        enabled: true,
        maxAge: 60 * 5,
        strategy: 'jwe',
      },
    },
    rateLimit: {
      enabled: true,
      storage: 'database',
      window: 60,
      max: 100,
    },
    advanced: {
      ipAddress: {
        ipAddressHeaders: ['cf-connecting-ip'],
      },
    },
    plugins: [
      anonymous({
        emailDomainName: 'anonymous.offset.local',
        generateName: (context) => {
          const name = readDisplayNameHeader(context.headers)
          if (!name) {
            throw new APIError('BAD_REQUEST', {
              message: 'Choose a display name between 2 and 32 characters.',
            })
          }
          return name
        },
        onLinkAccount: ({ anonymousUser, newUser }) => {
          console.info('Offset anonymous account upgraded', {
            anonymousUserId: anonymousUser.user.id,
            newUserId: newUser.user.id,
          })
        },
      }),
    ],
  })
}
