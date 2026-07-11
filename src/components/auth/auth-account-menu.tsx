import { useEffect, useRef, useState } from 'react'
import { LogOut, ShieldCheck, UserRoundCheck } from 'lucide-react'

import { authClient } from '#/auth/client'
import type { AuthIdentity } from '#/auth/identity'
import type { AuthCapabilities } from './studio-auth-gate'

interface AuthAccountMenuProps {
  identity: AuthIdentity & { color: string }
  capabilities: AuthCapabilities
}

export function AuthAccountMenu({
  identity,
  capabilities,
}: AuthAccountMenuProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const close = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    window.addEventListener('pointerdown', close)
    return () => window.removeEventListener('pointerdown', close)
  }, [])

  const upgradeWithGoogle = async () => {
    if (!capabilities.googleEnabled) return
    await authClient.signIn.social({
      provider: 'google',
      callbackURL: window.location.href,
    })
  }

  return (
    <div className="account-menu-root" ref={rootRef}>
      <button
        type="button"
        className="avatar account-avatar"
        style={{ background: identity.color }}
        title={`${identity.name} (you)`}
        aria-label="Open account menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {identity.image ? (
          <img src={identity.image} alt="" referrerPolicy="no-referrer" />
        ) : (
          identity.name.slice(0, 1).toUpperCase()
        )}
      </button>

      {open && (
        <div className="account-popover">
          <div className="account-popover-heading">
            <span style={{ background: identity.color }}>
              {identity.image ? (
                <img src={identity.image} alt="" referrerPolicy="no-referrer" />
              ) : (
                identity.name.slice(0, 1).toUpperCase()
              )}
            </span>
            <div>
              <strong>{identity.name}</strong>
              <small>
                {identity.isAnonymous ? 'Guest collaborator' : 'Google account'}
              </small>
            </div>
          </div>

          <div className="account-presence-state">
            <ShieldCheck size={13} />
            Authenticated presence
          </div>

          {identity.isAnonymous && capabilities.googleEnabled && (
            <button type="button" onClick={upgradeWithGoogle}>
              <UserRoundCheck size={14} />
              Save identity with Google
            </button>
          )}
          <button type="button" onClick={() => authClient.signOut()}>
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}
