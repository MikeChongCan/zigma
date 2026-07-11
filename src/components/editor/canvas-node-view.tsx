import { useState } from 'react'
import type { MouseEvent, PointerEvent, ReactNode } from 'react'

import type { CanvasNode } from '#/editor/types'

interface CanvasNodeViewProps {
  node: CanvasNode
  selected: boolean
  zoom: number
  children?: ReactNode
  onPointerDown: (event: PointerEvent<HTMLDivElement>, id: string) => void
  onResizePointerDown: (
    event: PointerEvent<HTMLButtonElement>,
    id: string,
  ) => void
  onContextMenu: (event: MouseEvent<HTMLDivElement>, id: string) => void
  onContentChange: (id: string, content: string) => void
}

const fontFamilies = {
  display: 'var(--font-display)',
  sans: 'var(--font-sans)',
  mono: 'var(--font-mono)',
}

export function CanvasNodeView({
  node,
  selected,
  zoom,
  children,
  onPointerDown,
  onResizePointerDown,
  onContextMenu,
  onContentChange,
}: CanvasNodeViewProps) {
  const [editing, setEditing] = useState(false)
  const style = node.style
  const isTextual = ['text', 'button', 'badge'].includes(node.kind)
  const surfaceStyle = {
    background: style.background,
    color: style.color,
    borderColor: style.borderColor,
    borderWidth: style.borderWidth,
    borderStyle: style.borderWidth ? 'solid' : undefined,
    borderRadius: style.radius,
    boxShadow: style.shadow,
    fontFamily: style.fontFamily ? fontFamilies[style.fontFamily] : undefined,
    fontSize: style.fontSize,
    fontWeight: style.fontWeight,
    letterSpacing: style.letterSpacing,
    lineHeight: style.lineHeight,
    textAlign: style.textAlign,
  }

  return (
    <div
      className="canvas-node"
      data-kind={node.kind}
      data-selected={selected}
      data-locked={node.locked}
      data-editing={editing}
      style={
        {
          left: node.x,
          top: node.y,
          width: node.width,
          height: node.height,
          opacity: node.opacity,
          transform: `rotate(${node.rotation}deg)`,
          display: node.hidden ? 'none' : undefined,
          '--selection-scale': 1 / zoom,
        } as React.CSSProperties
      }
      onPointerDown={(event) => onPointerDown(event, node.id)}
      onContextMenu={(event) => onContextMenu(event, node.id)}
      onDoubleClick={(event) => {
        if (!isTextual || node.locked) return
        event.stopPropagation()
        setEditing(true)
      }}
    >
      {node.kind === 'frame' && (
        <span className="frame-label">{node.name}</span>
      )}
      <div className="canvas-node-surface" style={surfaceStyle}>
        {node.kind === 'image' && (
          <div
            className={`canvas-art canvas-art-${node.asset ?? 'texture'}`}
            aria-label={node.name}
          >
            <span className="art-orbit" />
            <span className="art-object art-object-a" />
            <span className="art-object art-object-b" />
            <span className="art-glint" />
          </div>
        )}
        {isTextual && (
          <div
            className="canvas-node-content"
            contentEditable={editing}
            suppressContentEditableWarning
            role={node.kind === 'button' ? 'button' : undefined}
            onBlur={(event) => {
              setEditing(false)
              onContentChange(node.id, event.currentTarget.innerText)
            }}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                event.preventDefault()
                event.currentTarget.blur()
              }
            }}
          >
            {node.content}
          </div>
        )}
        {children}
      </div>
      {selected && !node.locked && !editing && (
        <>
          <span className="selection-outline" />
          <button
            type="button"
            className="resize-handle resize-handle-se"
            aria-label={`Resize ${node.name}`}
            onPointerDown={(event) => onResizePointerDown(event, node.id)}
          />
          <span className="selection-size">
            {Math.round(node.width)} × {Math.round(node.height)}
          </span>
        </>
      )}
      {node.locked && selected && (
        <span className="locked-indicator">LOCKED</span>
      )}
    </div>
  )
}
