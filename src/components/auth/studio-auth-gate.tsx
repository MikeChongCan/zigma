import { useEffect, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { ArrowRight, Cloud, LoaderCircle, LockKeyhole } from 'lucide-react'

import { authClient } from '#/auth/client'
import {
  DISPLAY_NAME_HEADER,
  encodeDisplayName,
  normalizeDisplayName,
} from '#/auth/identity'
import type { AuthIdentity } from '#/auth/identity'

export type AuthCapabilities = {
  googleEnabled: boolean
  googleCallbackUrl?: string
}

function isAuthCapabilities(value: unknown): value is AuthCapabilities {
  return (
    typeof value === 'object' &&
    value !== null &&
    'googleEnabled' in value &&
    typeof value.googleEnabled === 'boolean'
  )
}

interface StudioAuthGateProps {
  children: (
    identity: AuthIdentity,
    capabilities: AuthCapabilities,
  ) => ReactNode
}

export function StudioAuthGate({ children }: StudioAuthGateProps) {
  const session = authClient.useSession()
  const [capabilities, setCapabilities] = useState<AuthCapabilities>({
    googleEnabled: false,
  })

  useEffect(() => {
    let active = true
    void fetch('/api/auth/config')
      .then(async (response) => {
        if (!response.ok) return null
        const value: unknown = await response.json()
        return isAuthCapabilities(value) ? value : null
      })
      .then((value) => {
        if (active && value) setCapabilities(value)
      })
      .catch(() => undefined)
    return () => {
      active = false
    }
  }, [])

  if (session.isPending) return <AuthLoading />
  if (!session.data) return <AuthWelcome capabilities={capabilities} />

  const user = session.data.user
  return children(
    {
      id: user.id,
      name: user.name,
      image: user.image,
      isAnonymous: Boolean(user.isAnonymous),
    },
    capabilities,
  )
}

function AuthLoading() {
  return (
    <main className="auth-shell" aria-label="Loading your Offset session">
      <div className="auth-loading-mark">
        <span className="logo-glyph">
          <i />
          <i />
          <i />
        </span>
        <LoaderCircle className="auth-spinner" size={18} />
      </div>
    </main>
  )
}

function AuthWelcome({ capabilities }: { capabilities: AuthCapabilities }) {
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState<'guest' | 'google' | null>(null)
  const normalizedName = normalizeDisplayName(displayName)

  const continueAsGuest = async (event: FormEvent) => {
    event.preventDefault()
    if (!normalizedName) {
      setError('Use 2–32 letters or numbers. Spaces, dots and dashes are okay.')
      return
    }

    setError('')
    setPending('guest')
    const result = await authClient.signIn.anonymous({
      fetchOptions: {
        headers: {
          [DISPLAY_NAME_HEADER]: encodeDisplayName(normalizedName),
        },
      },
    })
    if (result.error) {
      setError(result.error.message ?? 'Could not start a guest session.')
      setPending(null)
    }
  }

  const continueWithGoogle = async () => {
    if (!capabilities.googleEnabled) return
    setError('')
    setPending('google')
    const result = await authClient.signIn.social({
      provider: 'google',
      callbackURL: window.location.href,
    })
    if (result.error) {
      setError(result.error.message ?? 'Google sign-in could not start.')
      setPending(null)
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-intro">
        <div className="auth-brand">
          <span className="logo-glyph">
            <i />
            <i />
            <i />
          </span>
          <strong>OFFSET</strong>
        </div>
        <div className="auth-coordinate">ROOM ACCESS / 01</div>
        <h1>
          Enter the canvas
          <em>as yourself.</em>
        </h1>
        <p>
          Your name travels with your cursor, selections, and live presence.
          Start as a guest or keep your identity with Google.
        </p>
        <div className="auth-presence-demo" aria-hidden="true">
          <span
            style={{ '--presence-color': '#ff6b45' } as React.CSSProperties}
          >
            M
          </span>
          <span
            style={{ '--presence-color': '#68a7ff' } as React.CSSProperties}
          >
            N
          </span>
          <span
            style={{ '--presence-color': '#a9d36e' } as React.CSSProperties}
          >
            +
          </span>
          <small>Live collaborators</small>
        </div>
      </section>

      <section className="auth-panel" aria-labelledby="auth-title">
        <div className="auth-panel-index">AUTH / EDGE</div>
        <div className="auth-panel-heading">
          <LockKeyhole size={17} />
          <div>
            <h2 id="auth-title">Choose your presence</h2>
            <p>Sessions are encrypted and stored on Cloudflare.</p>
          </div>
        </div>

        <form onSubmit={continueAsGuest}>
          <label htmlFor="display-name">Display name</label>
          <div className="auth-name-field">
            <input
              id="display-name"
              autoFocus
              autoComplete="nickname"
              maxLength={32}
              placeholder="e.g. Mika Chen"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
            />
            <span>{displayName.length}/32</span>
          </div>
          <button
            className="auth-guest-button"
            type="submit"
            disabled={pending !== null}
          >
            {pending === 'guest' ? (
              <LoaderCircle className="auth-spinner" size={16} />
            ) : (
              <ArrowRight size={16} />
            )}
            Continue as guest
          </button>
        </form>

        <div className="auth-divider">
          <span>or keep this identity</span>
        </div>

        <button
          className="auth-google-button"
          type="button"
          disabled={!capabilities.googleEnabled || pending !== null}
          onClick={continueWithGoogle}
        >
          {pending === 'google' ? (
            <LoaderCircle className="auth-spinner" size={16} />
          ) : (
            <span className="google-glyph">G</span>
          )}
          Continue with Google
        </button>
        {!capabilities.googleEnabled && (
          <p className="auth-provider-note">
            Google OAuth is ready for its production client credentials.
          </p>
        )}
        {error && <p className="auth-error">{error}</p>}

        <footer className="auth-panel-footer">
          <Cloud size={13} />
          Guest work still syncs and persists at the edge.
        </footer>
      </section>
    </main>
  )
}
