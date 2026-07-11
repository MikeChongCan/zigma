import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { KeyboardEvent, PointerEvent } from 'react'
import {
  ArrowDownToLine,
  ArrowUpToLine,
  Copy,
  CornerUpLeft,
  Eye,
  EyeOff,
  Lock,
  Trash2,
  Unlock,
} from 'lucide-react'

import { useEditorStore } from '#/editor/store'
import type { Point } from '#/editor/types'

interface ElementContextMenuProps {
  nodeId: string
  position: Point
  onClose: () => void
}

interface MenuAction {
  label: string
  shortcut?: string
  destructive?: boolean
  disabled?: boolean
  icon: typeof Copy
  onSelect: () => void
}

export function ElementContextMenu({
  nodeId,
  position,
  onClose,
}: ElementContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)
  const [placement, setPlacement] = useState(position)
  const nodes = useEditorStore((state) => state.nodes)
  const selection = useEditorStore((state) => state.selection)
  const setSelection = useEditorStore((state) => state.setSelection)
  const duplicateSelected = useEditorStore((state) => state.duplicateSelected)
  const deleteSelected = useEditorStore((state) => state.deleteSelected)
  const moveSelectedToEdge = useEditorStore((state) => state.moveSelectedToEdge)
  const setSelectedHidden = useEditorStore((state) => state.setSelectedHidden)
  const setSelectedLocked = useEditorStore((state) => state.setSelectedLocked)
  const node = nodes[nodeId]
  const selectedNodes = selection.flatMap((id) => {
    const selectedNode = nodes[id]
    return selectedNode ? [selectedNode] : []
  })
  const allHidden =
    selectedNodes.length > 0 && selectedNodes.every((item) => item.hidden)
  const allLocked =
    selectedNodes.length > 0 && selectedNodes.every((item) => item.locked)
  const hasLocked = selectedNodes.some((item) => item.locked)

  useLayoutEffect(() => {
    const menu = menuRef.current
    const container = menu?.parentElement
    if (!menu || !container) return
    const gutter = 10
    setPlacement({
      x: Math.min(
        Math.max(position.x, gutter),
        Math.max(gutter, container.clientWidth - menu.offsetWidth - gutter),
      ),
      y: Math.min(
        Math.max(position.y, gutter),
        Math.max(gutter, container.clientHeight - menu.offsetHeight - gutter),
      ),
    })
    menu
      .querySelector<HTMLButtonElement>('button:not(:disabled)')
      ?.focus({ preventScroll: true })
  }, [position, selection.length])

  useEffect(() => {
    const close = () => onClose()
    const closeFromOutside = (event: globalThis.PointerEvent) => {
      if (
        menuRef.current &&
        event.target instanceof Node &&
        !menuRef.current.contains(event.target)
      ) {
        onClose()
      }
    }
    window.addEventListener('blur', close)
    window.addEventListener('resize', close)
    document.addEventListener('pointerdown', closeFromOutside, true)
    return () => {
      window.removeEventListener('blur', close)
      window.removeEventListener('resize', close)
      document.removeEventListener('pointerdown', closeFromOutside, true)
    }
  }, [onClose])

  if (!node || !selectedNodes.length) return null

  const perform = (action: () => void) => {
    action()
    onClose()
  }

  const actions: Array<MenuAction | 'separator'> = [
    {
      label: selection.length > 1 ? 'Duplicate selection' : 'Duplicate',
      shortcut: '⌘D',
      icon: Copy,
      onSelect: () => perform(duplicateSelected),
    },
    ...(node.parentId
      ? ([
          {
            label: 'Select parent frame',
            icon: CornerUpLeft,
            onSelect: () =>
              perform(() => setSelection(node.parentId ? [node.parentId] : [])),
          },
        ] satisfies MenuAction[])
      : []),
    'separator',
    {
      label: 'Bring to front',
      icon: ArrowUpToLine,
      disabled: hasLocked,
      onSelect: () => perform(() => moveSelectedToEdge('front')),
    },
    {
      label: 'Send to back',
      icon: ArrowDownToLine,
      disabled: hasLocked,
      onSelect: () => perform(() => moveSelectedToEdge('back')),
    },
    'separator',
    {
      label: allHidden ? 'Show selection' : 'Hide selection',
      shortcut: '⇧⌘H',
      icon: allHidden ? Eye : EyeOff,
      onSelect: () => perform(() => setSelectedHidden(!allHidden)),
    },
    {
      label: allLocked ? 'Unlock selection' : 'Lock selection',
      shortcut: '⇧⌘L',
      icon: allLocked ? Unlock : Lock,
      onSelect: () => perform(() => setSelectedLocked(!allLocked)),
    },
    'separator',
    {
      label: selection.length > 1 ? 'Delete selection' : 'Delete',
      shortcut: '⌫',
      destructive: true,
      icon: Trash2,
      onSelect: () => perform(deleteSelected),
    },
  ]

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    event.stopPropagation()
    if (event.key === 'Escape') {
      event.preventDefault()
      onClose()
      return
    }
    const command = event.metaKey || event.ctrlKey
    if (command && event.key.toLowerCase() === 'd') {
      event.preventDefault()
      perform(duplicateSelected)
      return
    }
    if (event.key === 'Backspace' || event.key === 'Delete') {
      event.preventDefault()
      perform(deleteSelected)
      return
    }
    if (command && event.shiftKey && event.key.toLowerCase() === 'h') {
      event.preventDefault()
      perform(() => setSelectedHidden(!allHidden))
      return
    }
    if (command && event.shiftKey && event.key.toLowerCase() === 'l') {
      event.preventDefault()
      perform(() => setSelectedLocked(!allLocked))
      return
    }
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    const buttons = Array.from(
      menuRef.current?.querySelectorAll<HTMLButtonElement>(
        'button:not(:disabled)',
      ) ?? [],
    )
    if (!buttons.length) return
    const activeIndex = buttons.indexOf(
      document.activeElement as HTMLButtonElement,
    )
    const nextIndex =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? buttons.length - 1
          : event.key === 'ArrowDown'
            ? (activeIndex + 1 + buttons.length) % buttons.length
            : (activeIndex - 1 + buttons.length) % buttons.length
    buttons[nextIndex]?.focus()
  }

  return (
    <div
      ref={menuRef}
      className="element-context-menu"
      role="menu"
      aria-label="Element actions"
      style={{ left: placement.x, top: placement.y }}
      onContextMenu={(event) => event.preventDefault()}
      onPointerDown={(event: PointerEvent<HTMLDivElement>) =>
        event.stopPropagation()
      }
      onKeyDown={handleKeyDown}
    >
      <div className="context-menu-header">
        <span>
          {selection.length > 1 ? `${selection.length} layers` : node.kind}
        </span>
        <strong>{selection.length > 1 ? 'Selection' : node.name}</strong>
        <small>
          {Math.round(node.width)} × {Math.round(node.height)}
        </small>
      </div>
      <div className="context-menu-actions">
        {actions.map((action, index) =>
          action === 'separator' ? (
            <span
              className="context-menu-separator"
              key={`separator-${index}`}
            />
          ) : (
            <button
              type="button"
              role="menuitem"
              key={action.label}
              className={action.destructive ? 'is-destructive' : undefined}
              disabled={action.disabled}
              onClick={action.onSelect}
            >
              <action.icon size={14} strokeWidth={1.7} />
              <span>{action.label}</span>
              {action.shortcut && <kbd>{action.shortcut}</kbd>}
            </button>
          ),
        )}
      </div>
    </div>
  )
}
