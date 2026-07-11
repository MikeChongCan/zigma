import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowDown,
  ArrowUp,
  Blend,
  Box,
  CornerDownRight,
  Lock,
  Type,
} from 'lucide-react'

import { useEditorStore } from '#/editor/store'
import type { CanvasStyle } from '#/editor/types'

function NumberField({
  label,
  value,
  suffix,
  onChange,
  min,
  max,
  step,
}: {
  label: string
  value: number
  suffix?: string
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
}) {
  return (
    <label className="number-field">
      <span>{label}</span>
      <input
        type="number"
        value={Number.isFinite(value) ? Math.round(value * 100) / 100 : 0}
        min={min}
        max={max}
        step={step}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      {suffix && <small>{suffix}</small>}
    </label>
  )
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  const safeColor =
    value.startsWith('#') && (value.length === 4 || value.length === 7)
      ? value
      : '#171815'
  return (
    <label className="color-field">
      <span>{label}</span>
      <span className="color-swatch" style={{ background: value }}>
        <input
          type="color"
          value={safeColor}
          onChange={(event) => onChange(event.target.value)}
        />
      </span>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  )
}

export function InspectorPanel() {
  const nodes = useEditorStore((state) => state.nodes)
  const order = useEditorStore((state) => state.order)
  const selection = useEditorStore((state) => state.selection)
  const gridEnabled = useEditorStore((state) => state.gridEnabled)
  const updateNode = useEditorStore((state) => state.updateNode)
  const updateNodeStyle = useEditorStore((state) => state.updateNodeStyle)
  const reorderNode = useEditorStore((state) => state.reorderNode)
  const setGridEnabled = useEditorStore((state) => state.setGridEnabled)
  const beginGesture = useEditorStore((state) => state.beginGesture)
  const endGesture = useEditorStore((state) => state.endGesture)
  const node = selection.length === 1 ? nodes[selection[0]] : undefined

  if (!node) {
    return (
      <aside className="side-panel inspector-panel" aria-label="Inspector">
        <div className="inspector-titlebar">
          <span>Inspector</span>
          <span>
            {selection.length ? `${selection.length} selected` : 'Canvas'}
          </span>
        </div>
        <div className="document-inspector">
          <div className="document-mark">
            <span>∞</span>
          </div>
          <h2>{selection.length ? 'Multiple layers' : 'Infinite canvas'}</h2>
          <p>
            {selection.length
              ? 'Move, duplicate, hide, or delete this selection together.'
              : 'Select any layer to edit its geometry, type, fill, and hierarchy.'}
          </p>
          <dl>
            <div>
              <dt>Layers</dt>
              <dd>{Object.keys(nodes).length}</dd>
            </div>
            <div>
              <dt>Top-level frames</dt>
              <dd>
                {
                  Object.values(nodes).filter((item) => item && !item.parentId)
                    .length
                }
              </dd>
            </div>
            <div>
              <dt>Renderer</dt>
              <dd>React DOM</dd>
            </div>
            <div>
              <dt>Sync</dt>
              <dd>Yjs / Edge</dd>
            </div>
          </dl>
          <label className="inspector-toggle">
            <span>
              <strong>Snap to grid</strong>
              <small>8 px movement increments</small>
            </span>
            <input
              type="checkbox"
              checked={gridEnabled}
              onChange={(event) => setGridEnabled(event.target.checked)}
            />
          </label>
          <div className="shortcut-card">
            <span>Essential shortcuts</span>
            <div>
              <kbd>V</kbd>
              <span>Select</span>
              <kbd>Space</kbd>
              <span>Pan</span>
            </div>
            <div>
              <kbd>⌘D</kbd>
              <span>Duplicate</span>
              <kbd>⌘Z</kbd>
              <span>Undo</span>
            </div>
          </div>
        </div>
      </aside>
    )
  }

  const patchStyle = (patch: Partial<CanvasStyle>, commit = true) =>
    updateNodeStyle(node.id, patch, commit)

  return (
    <aside className="side-panel inspector-panel" aria-label="Inspector">
      <div className="inspector-titlebar">
        <span>Inspector</span>
        <span>{node.kind}</span>
      </div>
      <div className="inspector-scroll">
        <section className="inspector-section layer-identity">
          <div className="section-heading">
            <span>Layer</span>
            <Box size={13} />
          </div>
          <input
            className="layer-name-input"
            value={node.name}
            onChange={(event) =>
              updateNode(node.id, { name: event.target.value })
            }
          />
          <div className="order-buttons">
            <button type="button" onClick={() => reorderNode(node.id, 1)}>
              <ArrowUp size={13} /> Bring forward
            </button>
            <button type="button" onClick={() => reorderNode(node.id, -1)}>
              <ArrowDown size={13} /> Send backward
            </button>
          </div>
        </section>

        <section className="inspector-section">
          <div className="section-heading">
            <span>Transform</span>
            <CornerDownRight size={13} />
          </div>
          <div className="field-grid">
            <NumberField
              label="X"
              value={node.x}
              onChange={(x) => updateNode(node.id, { x })}
            />
            <NumberField
              label="Y"
              value={node.y}
              onChange={(y) => updateNode(node.id, { y })}
            />
            <NumberField
              label="W"
              value={node.width}
              min={1}
              onChange={(width) =>
                updateNode(node.id, { width: Math.max(1, width) })
              }
            />
            <NumberField
              label="H"
              value={node.height}
              min={1}
              onChange={(height) =>
                updateNode(node.id, { height: Math.max(1, height) })
              }
            />
            <NumberField
              label="↻"
              value={node.rotation}
              suffix="°"
              onChange={(rotation) => updateNode(node.id, { rotation })}
            />
            <NumberField
              label="R"
              value={node.style.radius ?? 0}
              min={0}
              onChange={(radius) => patchStyle({ radius })}
            />
          </div>
          <label className="inspector-toggle compact">
            <span>
              <Lock size={12} /> Lock layer
            </span>
            <input
              type="checkbox"
              checked={node.locked}
              onChange={(event) =>
                updateNode(node.id, { locked: event.target.checked })
              }
            />
          </label>
        </section>

        {node.content !== undefined && (
          <section className="inspector-section">
            <div className="section-heading">
              <span>Content</span>
              <Type size={13} />
            </div>
            <textarea
              value={node.content}
              rows={4}
              onChange={(event) =>
                updateNode(node.id, { content: event.target.value })
              }
            />
          </section>
        )}

        <section className="inspector-section">
          <div className="section-heading">
            <span>Appearance</span>
            <Blend size={13} />
          </div>
          <ColorField
            label="Fill"
            value={node.style.background ?? 'transparent'}
            onChange={(background) => patchStyle({ background })}
          />
          {(node.kind === 'text' ||
            node.kind === 'button' ||
            node.kind === 'badge') && (
            <ColorField
              label="Text"
              value={node.style.color ?? '#171815'}
              onChange={(color) => patchStyle({ color })}
            />
          )}
          <label className="range-field">
            <span>Opacity</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={node.opacity}
              onPointerDown={beginGesture}
              onPointerUp={endGesture}
              onChange={(event) =>
                updateNode(
                  node.id,
                  { opacity: Number(event.target.value) },
                  false,
                )
              }
            />
            <small>{Math.round(node.opacity * 100)}%</small>
          </label>
          <div className="field-grid">
            <NumberField
              label="Border"
              value={node.style.borderWidth ?? 0}
              min={0}
              onChange={(borderWidth) => patchStyle({ borderWidth })}
            />
            <NumberField
              label="Radius"
              value={node.style.radius ?? 0}
              min={0}
              onChange={(radius) => patchStyle({ radius })}
            />
          </div>
        </section>

        {node.style.fontFamily && (
          <section className="inspector-section">
            <div className="section-heading">
              <span>Typography</span>
              <Type size={13} />
            </div>
            <label className="select-field">
              <span>Typeface</span>
              <select
                value={node.style.fontFamily}
                onChange={(event) =>
                  patchStyle({
                    fontFamily: event.target.value as CanvasStyle['fontFamily'],
                  })
                }
              >
                <option value="display">Newsreader</option>
                <option value="sans">Archivo</option>
                <option value="mono">IBM Plex Mono</option>
              </select>
            </label>
            <div className="field-grid">
              <NumberField
                label="Size"
                value={node.style.fontSize ?? 16}
                min={6}
                onChange={(fontSize) => patchStyle({ fontSize })}
              />
              <NumberField
                label="Weight"
                value={node.style.fontWeight ?? 400}
                min={100}
                max={900}
                step={10}
                onChange={(fontWeight) => patchStyle({ fontWeight })}
              />
              <NumberField
                label="Line"
                value={node.style.lineHeight ?? 1.2}
                min={0.5}
                step={0.05}
                onChange={(lineHeight) => patchStyle({ lineHeight })}
              />
              <NumberField
                label="Track"
                value={node.style.letterSpacing ?? 0}
                step={0.1}
                onChange={(letterSpacing) => patchStyle({ letterSpacing })}
              />
            </div>
            <div className="segment-control" aria-label="Text alignment">
              {(
                [
                  ['left', AlignLeft],
                  ['center', AlignCenter],
                  ['right', AlignRight],
                ] as const
              ).map(([alignment, Icon]) => (
                <button
                  type="button"
                  key={alignment}
                  data-active={(node.style.textAlign ?? 'left') === alignment}
                  onClick={() => patchStyle({ textAlign: alignment })}
                >
                  <Icon size={14} />
                </button>
              ))}
            </div>
          </section>
        )}

        <section className="inspector-section inspector-debug">
          <div className="section-heading">
            <span>Node</span>
            <span>#{order.indexOf(node.id) + 1}</span>
          </div>
          <code>{node.id.slice(0, 18)}</code>
        </section>
      </div>
    </aside>
  )
}
