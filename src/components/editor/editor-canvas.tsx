import { useCallback, useMemo, useRef, useState } from 'react'
import type { MouseEvent, PointerEvent, WheelEvent } from 'react'
import { Grid3X3, LocateFixed, Minus, Plus } from 'lucide-react'

import { clampZoom, screenToWorld, zoomAroundPoint } from '#/editor/geometry'
import { useEditorStore, useEditorStoreApi } from '#/editor/store'
import type { CanvasNode, Collaborator, Point } from '#/editor/types'

import { CanvasNodeView } from './canvas-node-view'
import { ElementContextMenu } from './element-context-menu'
import { EditorToolbar } from './editor-toolbar'

interface EditorCanvasProps {
  collaborators: Collaborator[]
  updateCursor: (cursor?: Point) => void
}

type Interaction =
  | { mode: 'pan'; start: Point; camera: { x: number; y: number } }
  | { mode: 'move'; start: Point; lastDelta: Point }
  | {
      mode: 'resize'
      start: Point
      nodeId: string
      width: number
      height: number
    }

interface ContextMenuState extends Point {
  nodeId: string
}

export function EditorCanvas({
  collaborators,
  updateCursor,
}: EditorCanvasProps) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const interactionRef = useRef<Interaction | null>(null)
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)
  const store = useEditorStoreApi()
  const nodes = useEditorStore((state) => state.nodes)
  const order = useEditorStore((state) => state.order)
  const selection = useEditorStore((state) => state.selection)
  const tool = useEditorStore((state) => state.tool)
  const camera = useEditorStore((state) => state.camera)
  const gridEnabled = useEditorStore((state) => state.gridEnabled)
  const setCamera = useEditorStore((state) => state.setCamera)
  const setSelection = useEditorStore((state) => state.setSelection)
  const setGridEnabled = useEditorStore((state) => state.setGridEnabled)
  const addNode = useEditorStore((state) => state.addNode)
  const beginGesture = useEditorStore((state) => state.beginGesture)
  const endGesture = useEditorStore((state) => state.endGesture)
  const moveSelection = useEditorStore((state) => state.moveSelection)
  const resizeNode = useEditorStore((state) => state.resizeNode)

  const closeContextMenu = useCallback(() => setContextMenu(null), [])

  const childrenByParent = useMemo(() => {
    const result = new Map<string | null, string[]>()
    for (const id of order) {
      const node = nodes[id]
      if (!node) continue
      const children = result.get(node.parentId) ?? []
      children.push(id)
      result.set(node.parentId, children)
    }
    return result
  }, [nodes, order])

  const startPan = useCallback(
    (event: PointerEvent) => {
      closeContextMenu()
      interactionRef.current = {
        mode: 'pan',
        start: { x: event.clientX, y: event.clientY },
        camera: { x: camera.x, y: camera.y },
      }
      ;(event.target as HTMLElement).setPointerCapture(event.pointerId)
    },
    [camera.x, camera.y, closeContextMenu],
  )

  const onNodePointerDown = useCallback(
    (event: PointerEvent<HTMLDivElement>, id: string) => {
      event.stopPropagation()
      const node = store.getState().nodes[id]
      if (!node) return
      if (event.button === 2) {
        if (!selection.includes(id)) setSelection([id])
        return
      }
      if (tool === 'hand' || event.button === 1) {
        startPan(event)
        return
      }
      if (event.button !== 0) return
      closeContextMenu()
      if (tool !== 'select') {
        const viewport = viewportRef.current
        if (!viewport) return
        addNode(
          tool,
          screenToWorld(
            { x: event.clientX, y: event.clientY },
            camera,
            viewport.getBoundingClientRect(),
          ),
        )
        return
      }

      if (event.shiftKey) store.getState().toggleSelection(id)
      else if (!selection.includes(id)) setSelection([id])
      if (node.locked) return

      beginGesture()
      interactionRef.current = {
        mode: 'move',
        start: { x: event.clientX, y: event.clientY },
        lastDelta: { x: 0, y: 0 },
      }
      event.currentTarget.setPointerCapture(event.pointerId)
    },
    [
      addNode,
      beginGesture,
      camera,
      closeContextMenu,
      selection,
      setSelection,
      startPan,
      store,
      tool,
    ],
  )

  const onNodeContextMenu = useCallback(
    (event: MouseEvent<HTMLDivElement>, id: string) => {
      event.preventDefault()
      event.stopPropagation()
      const viewport = viewportRef.current
      if (!viewport) return
      if (!selection.includes(id)) setSelection([id])
      const rect = viewport.getBoundingClientRect()
      setContextMenu({
        nodeId: id,
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      })
    },
    [selection, setSelection],
  )

  const onResizePointerDown = useCallback(
    (event: PointerEvent<HTMLButtonElement>, id: string) => {
      event.preventDefault()
      event.stopPropagation()
      const node = store.getState().nodes[id]
      if (!node) return
      beginGesture()
      interactionRef.current = {
        mode: 'resize',
        start: { x: event.clientX, y: event.clientY },
        nodeId: id,
        width: node.width,
        height: node.height,
      }
      event.currentTarget.setPointerCapture(event.pointerId)
    },
    [beginGesture, store],
  )

  const onPointerMove = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      const viewport = viewportRef.current
      if (viewport)
        updateCursor(
          screenToWorld(
            { x: event.clientX, y: event.clientY },
            camera,
            viewport.getBoundingClientRect(),
          ),
        )

      const interaction = interactionRef.current
      if (!interaction) return
      if (interaction.mode === 'pan') {
        setCamera({
          ...camera,
          x: interaction.camera.x + event.clientX - interaction.start.x,
          y: interaction.camera.y + event.clientY - interaction.start.y,
        })
        return
      }

      const total = {
        x: (event.clientX - interaction.start.x) / camera.zoom,
        y: (event.clientY - interaction.start.y) / camera.zoom,
      }
      if (interaction.mode === 'move') {
        const incremental = {
          x: total.x - interaction.lastDelta.x,
          y: total.y - interaction.lastDelta.y,
        }
        interaction.lastDelta = total
        moveSelection(incremental, gridEnabled && !event.altKey)
      } else {
        resizeNode(
          interaction.nodeId,
          interaction.width + total.x,
          interaction.height + total.y,
          gridEnabled && !event.altKey,
        )
      }
    },
    [camera, gridEnabled, moveSelection, resizeNode, setCamera, updateCursor],
  )

  const finishInteraction = useCallback(() => {
    const interaction = interactionRef.current
    if (interaction && interaction.mode !== 'pan') endGesture()
    interactionRef.current = null
  }, [endGesture])

  const onCanvasPointerDown = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      closeContextMenu()
      if (event.button === 1 || tool === 'hand') {
        event.preventDefault()
        startPan(event)
        return
      }
      if (event.button !== 0) return
      const viewport = viewportRef.current
      if (!viewport) return
      const point = screenToWorld(
        { x: event.clientX, y: event.clientY },
        camera,
        viewport.getBoundingClientRect(),
      )
      if (tool === 'select') setSelection([])
      else addNode(tool, point)
    },
    [addNode, camera, closeContextMenu, setSelection, startPan, tool],
  )

  const onWheel = useCallback(
    (event: WheelEvent<HTMLDivElement>) => {
      event.preventDefault()
      closeContextMenu()
      const viewport = viewportRef.current
      if (!viewport) return
      const rect = viewport.getBoundingClientRect()
      if (event.ctrlKey || event.metaKey) {
        const point = {
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
        }
        const factor = Math.exp(-event.deltaY * 0.008)
        setCamera(zoomAroundPoint(camera, camera.zoom * factor, point))
      } else {
        setCamera({
          ...camera,
          x: camera.x - event.deltaX,
          y: camera.y - event.deltaY,
        })
      }
    },
    [camera, closeContextMenu, setCamera],
  )

  const zoomBy = (factor: number) => {
    const viewport = viewportRef.current
    if (!viewport) return
    setCamera(
      zoomAroundPoint(camera, camera.zoom * factor, {
        x: viewport.clientWidth / 2,
        y: viewport.clientHeight / 2,
      }),
    )
  }

  const fitContent = () => {
    const viewport = viewportRef.current
    const roots = order
      .map((id) => nodes[id])
      .filter((node): node is CanvasNode =>
        Boolean(node && !node.parentId && !node.hidden),
      )
    if (!viewport || !roots.length) return
    const minX = Math.min(...roots.map((node) => node.x))
    const minY = Math.min(...roots.map((node) => node.y))
    const maxX = Math.max(...roots.map((node) => node.x + node.width))
    const maxY = Math.max(...roots.map((node) => node.y + node.height))
    const padding = 120
    const zoom = clampZoom(
      Math.min(
        (viewport.clientWidth - padding) / (maxX - minX),
        (viewport.clientHeight - padding) / (maxY - minY),
      ),
    )
    setCamera({
      zoom,
      x: (viewport.clientWidth - (maxX - minX) * zoom) / 2 - minX * zoom,
      y: (viewport.clientHeight - (maxY - minY) * zoom) / 2 - minY * zoom,
    })
  }

  const renderNode = (id: string): React.ReactNode => {
    const node = nodes[id]
    if (!node) return null
    return (
      <CanvasNodeView
        key={id}
        node={node}
        selected={selection.includes(id)}
        zoom={camera.zoom}
        onPointerDown={onNodePointerDown}
        onResizePointerDown={onResizePointerDown}
        onContextMenu={onNodeContextMenu}
        onContentChange={(nodeId, content) =>
          store.getState().updateNode(nodeId, { content })
        }
      >
        {childrenByParent.get(id)?.map(renderNode)}
      </CanvasNodeView>
    )
  }

  return (
    <main
      ref={viewportRef}
      className={`editor-canvas tool-${tool}`}
      style={
        {
          '--grid-x': `${camera.x}px`,
          '--grid-y': `${camera.y}px`,
          '--grid-small': `${24 * camera.zoom}px`,
          '--grid-large': `${120 * camera.zoom}px`,
        } as React.CSSProperties
      }
      onPointerDown={onCanvasPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={finishInteraction}
      onPointerCancel={finishInteraction}
      onPointerLeave={() => updateCursor(undefined)}
      onWheel={onWheel}
    >
      <div className="canvas-atmosphere" />
      <div
        className="canvas-world"
        style={{
          transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.zoom})`,
        }}
      >
        {childrenByParent.get(null)?.map(renderNode)}
        {collaborators.map((collaborator) =>
          collaborator.cursor ? (
            <div
              className="remote-cursor"
              key={collaborator.clientId}
              style={
                {
                  left: collaborator.cursor.x,
                  top: collaborator.cursor.y,
                  color: collaborator.color,
                  '--cursor-scale': 1 / camera.zoom,
                } as React.CSSProperties
              }
            >
              <svg
                width="18"
                height="22"
                viewBox="0 0 18 22"
                aria-hidden="true"
              >
                <path
                  d="M1 1.4 16.2 12l-7.1 1.15-3.8 6.1L1 1.4Z"
                  fill="currentColor"
                  stroke="#0d0f10"
                  strokeWidth="1.2"
                />
              </svg>
              <span style={{ background: collaborator.color }}>
                {collaborator.name}
              </span>
            </div>
          ) : null,
        )}
      </div>
      <EditorToolbar />
      {contextMenu && (
        <ElementContextMenu
          nodeId={contextMenu.nodeId}
          position={contextMenu}
          onClose={closeContextMenu}
        />
      )}
      <div className="canvas-statusbar">
        <button
          type="button"
          onClick={() => setGridEnabled(!gridEnabled)}
          data-active={gridEnabled}
          title="Toggle grid"
        >
          <Grid3X3 size={14} />
          Grid
        </button>
        <span className="status-separator" />
        <button
          type="button"
          onClick={() => zoomBy(0.85)}
          aria-label="Zoom out"
        >
          <Minus size={14} />
        </button>
        <button
          type="button"
          className="zoom-value"
          onClick={() => setCamera({ ...camera, zoom: 1 })}
        >
          {Math.round(camera.zoom * 100)}%
        </button>
        <button type="button" onClick={() => zoomBy(1.18)} aria-label="Zoom in">
          <Plus size={14} />
        </button>
        <button type="button" onClick={fitContent} title="Fit all">
          <LocateFixed size={14} />
        </button>
      </div>
      <div className="canvas-help">
        Scroll to pan · pinch to zoom · hold Space to move
      </div>
    </main>
  )
}
