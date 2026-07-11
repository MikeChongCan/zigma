import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import {
  Check,
  ChevronDown,
  Cloud,
  CloudOff,
  Download,
  PanelLeftClose,
  PanelRightClose,
  Redo2,
  Share2,
  Undo2,
} from 'lucide-react'

import { AuthAccountMenu } from '#/components/auth/auth-account-menu'
import type { AuthCapabilities } from '#/components/auth/studio-auth-gate'
import { useEditorStore } from '#/editor/store'
import type { Collaborator, PresenceUser } from '#/editor/types'

import { ExportDialog } from './export-dialog'

interface EditorHeaderProps {
  collaborators: Collaborator[]
  self: PresenceUser
  capabilities: AuthCapabilities
}

export function EditorHeader({
  collaborators,
  self,
  capabilities,
}: EditorHeaderProps) {
  const [copied, setCopied] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const title = useEditorStore((state) => state.title)
  const setTitle = useEditorStore((state) => state.setTitle)
  const status = useEditorStore((state) => state.connectionStatus)
  const historyLength = useEditorStore((state) => state.history.length)
  const futureLength = useEditorStore((state) => state.future.length)
  const leftPanelOpen = useEditorStore((state) => state.leftPanelOpen)
  const rightPanelOpen = useEditorStore((state) => state.rightPanelOpen)
  const setPanelOpen = useEditorStore((state) => state.setPanelOpen)
  const undo = useEditorStore((state) => state.undo)
  const redo = useEditorStore((state) => state.redo)

  const togglePanel = (side: 'left' | 'right') => {
    const opening = side === 'left' ? !leftPanelOpen : !rightPanelOpen
    if (opening && window.matchMedia('(max-width: 760px)').matches) {
      setPanelOpen(side === 'left' ? 'right' : 'left', false)
    }
    setPanelOpen(side, opening)
  }

  const share = async () => {
    await navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  return (
    <header className="editor-header">
      <div className="editor-brand-zone">
        <Link to="/" className="editor-logo" aria-label="Zigma home">
          <span className="logo-glyph">
            <i />
            <i />
            <i />
          </span>
          <strong>ZIGMA</strong>
        </Link>
        <span className="header-divider" />
        <button
          type="button"
          className="panel-toggle"
          data-active={leftPanelOpen}
          onClick={() => togglePanel('left')}
          title="Toggle layers"
        >
          <PanelLeftClose size={15} />
        </button>
      </div>

      <div className="document-title-zone">
        <input
          aria-label="Document title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
        <ChevronDown size={13} />
        <span className={`sync-state sync-${status}`}>
          {status === 'offline' ? <CloudOff size={12} /> : <Cloud size={12} />}
          {status === 'synced'
            ? 'Saved to edge'
            : status === 'connecting'
              ? 'Connecting'
              : 'Local mode'}
        </span>
      </div>

      <div className="editor-actions-zone">
        <div className="history-controls">
          <button
            type="button"
            onClick={undo}
            disabled={!historyLength}
            aria-label="Undo"
          >
            <Undo2 size={15} />
          </button>
          <button
            type="button"
            onClick={redo}
            disabled={!futureLength}
            aria-label="Redo"
          >
            <Redo2 size={15} />
          </button>
        </div>
        <div
          className="avatar-stack"
          aria-label={`${collaborators.length + 1} collaborators`}
        >
          <AuthAccountMenu
            identity={{
              id: self.userId,
              name: self.name,
              image: self.image,
              isAnonymous: self.isAnonymous,
              color: self.color,
            }}
            capabilities={capabilities}
          />
          {collaborators.slice(0, 3).map((collaborator) => (
            <span
              className="avatar"
              key={collaborator.clientId}
              style={{ background: collaborator.color }}
              title={collaborator.name}
            >
              {collaborator.image ? (
                <img
                  src={collaborator.image}
                  alt=""
                  referrerPolicy="no-referrer"
                />
              ) : (
                collaborator.name.slice(0, 1).toUpperCase()
              )}
            </span>
          ))}
          {collaborators.length > 3 && (
            <span className="avatar avatar-more">
              +{collaborators.length - 3}
            </span>
          )}
        </div>
        <button
          type="button"
          className="export-button"
          onClick={() => setExportOpen(true)}
        >
          <Download size={14} />
          Export
        </button>
        <button type="button" className="share-button" onClick={share}>
          {copied ? <Check size={14} /> : <Share2 size={14} />}
          {copied ? 'Link copied' : 'Share'}
        </button>
        <button
          type="button"
          className="panel-toggle"
          data-active={rightPanelOpen}
          onClick={() => togglePanel('right')}
          title="Toggle inspector"
        >
          <PanelRightClose size={15} />
        </button>
      </div>
      <ExportDialog open={exportOpen} onClose={() => setExportOpen(false)} />
    </header>
  )
}
