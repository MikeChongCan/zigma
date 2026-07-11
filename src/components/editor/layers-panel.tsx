import { useMemo, useState } from 'react'
import {
  BoxSelect,
  ChevronDown,
  ChevronRight,
  Circle,
  Eye,
  EyeOff,
  Frame,
  Image,
  Layers3,
  Lock,
  LockOpen,
  MousePointer2,
  Search,
  Shapes,
  Type,
} from 'lucide-react'

import { useEditorStore } from '#/editor/store'
import type { CanvasNode, NodeKind } from '#/editor/types'

const nodeIcons: Record<NodeKind, typeof Frame> = {
  frame: Frame,
  text: Type,
  button: BoxSelect,
  shape: Circle,
  image: Image,
  badge: Shapes,
}

const assets: Array<{ kind: NodeKind; name: string; detail: string }> = [
  { kind: 'frame', name: 'Desktop frame', detail: '1440 × 900' },
  { kind: 'frame', name: 'Mobile frame', detail: '390 × 844' },
  { kind: 'text', name: 'Display heading', detail: 'Newsreader / 56' },
  { kind: 'button', name: 'Primary button', detail: 'Clay / Solid' },
  { kind: 'image', name: 'Editorial image', detail: '4:5 / Generated' },
  { kind: 'badge', name: 'Metadata chip', detail: 'Mono / Compact' },
]

export function LayersPanel() {
  const [tab, setTab] = useState<'layers' | 'assets'>('layers')
  const [query, setQuery] = useState('')
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const nodes = useEditorStore((state) => state.nodes)
  const order = useEditorStore((state) => state.order)
  const selection = useEditorStore((state) => state.selection)
  const camera = useEditorStore((state) => state.camera)
  const setSelection = useEditorStore((state) => state.setSelection)
  const toggleNodeHidden = useEditorStore((state) => state.toggleNodeHidden)
  const toggleNodeLocked = useEditorStore((state) => state.toggleNodeLocked)
  const addNode = useEditorStore((state) => state.addNode)

  const childrenByParent = useMemo(() => {
    const result = new Map<string | null, string[]>()
    for (const id of [...order].reverse()) {
      const node = nodes[id]
      if (!node) continue
      const children = result.get(node.parentId) ?? []
      children.push(id)
      result.set(node.parentId, children)
    }
    return result
  }, [nodes, order])

  const normalizedQuery = query.trim().toLowerCase()

  const layerMatches = (node: CanvasNode): boolean => {
    if (!normalizedQuery) return true
    if (node.name.toLowerCase().includes(normalizedQuery)) return true
    return (
      childrenByParent.get(node.id)?.some((id): boolean => {
        const child = nodes[id]
        return child ? layerMatches(child) : false
      }) ?? false
    )
  }

  const renderLayer = (id: string, depth = 0): React.ReactNode => {
    const node = nodes[id]
    if (!node || !layerMatches(node)) return null
    const children = childrenByParent.get(id) ?? []
    const isCollapsed = collapsed.has(id)
    const Icon = nodeIcons[node.kind]
    return (
      <div key={id} className="layer-tree-item">
        <div
          className="layer-row"
          data-selected={selection.includes(id)}
          style={{ '--layer-depth': depth } as React.CSSProperties}
        >
          <button
            className="layer-disclosure"
            type="button"
            aria-label={isCollapsed ? 'Expand layer' : 'Collapse layer'}
            disabled={!children.length}
            onClick={(event) => {
              event.stopPropagation()
              setCollapsed((current) => {
                const next = new Set(current)
                if (next.has(id)) next.delete(id)
                else next.add(id)
                return next
              })
            }}
          >
            {children.length ? (
              isCollapsed ? (
                <ChevronRight size={12} />
              ) : (
                <ChevronDown size={12} />
              )
            ) : null}
          </button>
          <button
            className="layer-select"
            type="button"
            onClick={(event) =>
              event.shiftKey ? useShiftSelection(id) : setSelection([id])
            }
          >
            <Icon className="layer-type-icon" size={14} strokeWidth={1.7} />
            <span className="layer-name">{node.name}</span>
          </button>
          <div className="layer-actions">
            <button
              type="button"
              aria-label={
                node.hidden ? `Show ${node.name}` : `Hide ${node.name}`
              }
              onClick={(event) => {
                event.stopPropagation()
                toggleNodeHidden(id)
              }}
            >
              {node.hidden ? <EyeOff size={12} /> : <Eye size={12} />}
            </button>
            <button
              type="button"
              aria-label={
                node.locked ? `Unlock ${node.name}` : `Lock ${node.name}`
              }
              onClick={(event) => {
                event.stopPropagation()
                toggleNodeLocked(id)
              }}
            >
              {node.locked ? <Lock size={12} /> : <LockOpen size={12} />}
            </button>
          </div>
        </div>
        {!isCollapsed &&
          children.map((childId) => renderLayer(childId, depth + 1))}
      </div>
    )
  }

  const useShiftSelection = (id: string) => {
    setSelection(
      selection.includes(id)
        ? selection.filter((selectedId) => selectedId !== id)
        : [...selection, id],
    )
  }

  return (
    <aside className="side-panel layers-panel" aria-label="Layers and assets">
      <div className="panel-tabs">
        <button
          type="button"
          data-active={tab === 'layers'}
          onClick={() => setTab('layers')}
        >
          Layers
        </button>
        <button
          type="button"
          data-active={tab === 'assets'}
          onClick={() => setTab('assets')}
        >
          Assets
        </button>
      </div>
      <label className="panel-search">
        <Search size={13} />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={tab === 'layers' ? 'Find a layer' : 'Find an asset'}
        />
        <kbd>⌘F</kbd>
      </label>

      {tab === 'layers' ? (
        <div className="layer-list">
          <div className="layer-list-heading">
            <span>Page / Home</span>
            <span>{Object.keys(nodes).length}</span>
          </div>
          {childrenByParent.get(null)?.map((id) => renderLayer(id))}
        </div>
      ) : (
        <div className="asset-library">
          <div className="asset-library-intro">
            <Layers3 size={16} />
            <div>
              <strong>Local primitives</strong>
              <span>React elements, not flattened pixels.</span>
            </div>
          </div>
          <div className="asset-grid">
            {assets
              .filter((asset) =>
                asset.name.toLowerCase().includes(normalizedQuery),
              )
              .map((asset) => {
                const Icon = nodeIcons[asset.kind]
                return (
                  <button
                    type="button"
                    key={`${asset.kind}-${asset.name}`}
                    onClick={() =>
                      addNode(asset.kind, {
                        x: (560 - camera.x) / camera.zoom,
                        y: (360 - camera.y) / camera.zoom,
                      })
                    }
                  >
                    <span className="asset-preview">
                      <Icon size={21} strokeWidth={1.4} />
                    </span>
                    <strong>{asset.name}</strong>
                    <small>{asset.detail}</small>
                  </button>
                )
              })}
          </div>
        </div>
      )}
      <div className="panel-footer-note">
        <MousePointer2 size={12} />
        Shift-click for multi-select
      </div>
    </aside>
  )
}
