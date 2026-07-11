import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import {
  Check,
  ChevronDown,
  Cloud,
  CloudOff,
  PanelLeftClose,
  PanelRightClose,
  Redo2,
  Share2,
  Undo2,
} from 'lucide-react'

import { useEditorStore } from '#/editor/store'
import type { Collaborator } from '#/editor/types'

interface EditorHeaderProps {
  collaborators: Collaborator[]
  self: { name: string; color: string }
}

export function EditorHeader({ collaborators, self }: EditorHeaderProps) {
  const [copied, setCopied] = useState(false)
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
        <Link to="/" className="editor-logo" aria-label="Offset home">
          <span className="logo-glyph">
            <i />
            <i />
            <i />
          </span>
          <strong>OFFSET</strong>
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
          <span
            className="avatar"
            style={{ background: self.color }}
            title={`${self.name} (you)`}
          >
            {self.name.slice(0, 1)}
          </span>
          {collaborators.slice(0, 3).map((collaborator) => (
            <span
              className="avatar"
              key={collaborator.clientId}
              style={{ background: collaborator.color }}
              title={collaborator.name}
            >
              {collaborator.name.slice(0, 1)}
            </span>
          ))}
          {collaborators.length > 3 && (
            <span className="avatar avatar-more">
              +{collaborators.length - 3}
            </span>
          )}
        </div>
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
    </header>
  )
}
