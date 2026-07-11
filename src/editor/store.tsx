import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'
import { createStore } from 'zustand/vanilla'
import type { StoreApi } from 'zustand/vanilla'
import { useStore } from 'zustand'

import { initialDocument } from './document'
import {
  descendantsOf,
  getFrameAtPoint,
  pointRelativeToParent,
  snap,
} from './geometry'
import { createCanvasNode } from './node-factory'
import type {
  Camera,
  CanvasDocument,
  CanvasNode,
  CanvasNodeMap,
  CanvasStyle,
  ConnectionStatus,
  EditorTool,
  NodeKind,
  Point,
} from './types'

interface SceneSnapshot {
  nodes: CanvasNodeMap
  order: string[]
}

interface EditorState extends SceneSnapshot {
  documentId: string
  title: string
  selection: string[]
  tool: EditorTool
  camera: Camera
  gridEnabled: boolean
  leftPanelOpen: boolean
  rightPanelOpen: boolean
  connectionStatus: ConnectionStatus
  history: SceneSnapshot[]
  future: SceneSnapshot[]
  gestureSnapshot: SceneSnapshot | null
  setTitle: (title: string) => void
  setSelection: (selection: string[]) => void
  toggleSelection: (id: string) => void
  setTool: (tool: EditorTool) => void
  setCamera: (camera: Camera) => void
  setGridEnabled: (enabled: boolean) => void
  setPanelOpen: (side: 'left' | 'right', open: boolean) => void
  setConnectionStatus: (status: ConnectionStatus) => void
  replaceScene: (scene: SceneSnapshot) => void
  updateNode: (id: string, patch: Partial<CanvasNode>, commit?: boolean) => void
  updateNodeStyle: (
    id: string,
    patch: Partial<CanvasStyle>,
    commit?: boolean,
  ) => void
  addNode: (kind: NodeKind, point: Point) => string
  deleteSelected: () => void
  duplicateSelected: () => void
  beginGesture: () => void
  endGesture: () => void
  moveSelection: (delta: Point, snapToGrid?: boolean) => void
  resizeNode: (
    id: string,
    width: number,
    height: number,
    snapToGrid?: boolean,
  ) => void
  toggleNodeHidden: (id: string) => void
  toggleNodeLocked: (id: string) => void
  reorderNode: (id: string, direction: -1 | 1) => void
  moveSelectedToEdge: (edge: 'front' | 'back') => void
  setSelectedHidden: (hidden: boolean) => void
  setSelectedLocked: (locked: boolean) => void
  undo: () => void
  redo: () => void
}

const snapshot = (
  state: Pick<EditorState, 'nodes' | 'order'>,
): SceneSnapshot => ({
  nodes: state.nodes,
  order: state.order,
})

const createInitialState = (document: CanvasDocument) => ({
  documentId: document.id,
  title: document.title,
  nodes: document.nodes,
  order: document.order,
})

export function createEditorStore(document: CanvasDocument = initialDocument) {
  return createStore<EditorState>((set, get) => {
    const checkpoint = () => {
      const state = get()
      set({
        history: [...state.history.slice(-79), snapshot(state)],
        future: [],
      })
    }

    return {
      ...createInitialState(document),
      selection: [],
      tool: 'select',
      camera: { x: 84, y: 54, zoom: 0.72 },
      gridEnabled: true,
      leftPanelOpen: true,
      rightPanelOpen: true,
      connectionStatus: 'connecting',
      history: [],
      future: [],
      gestureSnapshot: null,
      setTitle: (title) => set({ title }),
      setSelection: (selection) => set({ selection }),
      toggleSelection: (id) => {
        const selection = get().selection
        set({
          selection: selection.includes(id)
            ? selection.filter((item) => item !== id)
            : [...selection, id],
        })
      },
      setTool: (tool) => set({ tool }),
      setCamera: (camera) => set({ camera }),
      setGridEnabled: (gridEnabled) => set({ gridEnabled }),
      setPanelOpen: (side, open) =>
        set(
          side === 'left' ? { leftPanelOpen: open } : { rightPanelOpen: open },
        ),
      setConnectionStatus: (connectionStatus) => set({ connectionStatus }),
      replaceScene: (scene) =>
        set({
          ...scene,
          selection: get().selection.filter((id) => Boolean(scene.nodes[id])),
        }),
      updateNode: (id, patch, commit = true) => {
        const node = get().nodes[id]
        if (!node) return
        if (commit) checkpoint()
        set((state) => ({
          nodes: { ...state.nodes, [id]: { ...node, ...patch } },
        }))
      },
      updateNodeStyle: (id, patch, commit = true) => {
        const node = get().nodes[id]
        if (!node) return
        if (commit) checkpoint()
        set((state) => ({
          nodes: {
            ...state.nodes,
            [id]: { ...node, style: { ...node.style, ...patch } },
          },
        }))
      },
      addNode: (kind, point) => {
        const state = get()
        const parent =
          kind === 'frame'
            ? undefined
            : getFrameAtPoint(point, state.nodes, state.order)
        const localPoint = pointRelativeToParent(point, parent, state.nodes)
        const node = createCanvasNode(kind, localPoint, parent?.id ?? null)
        checkpoint()
        set((current) => ({
          nodes: { ...current.nodes, [node.id]: node },
          order: [...current.order, node.id],
          selection: [node.id],
          tool: 'select',
        }))
        return node.id
      },
      deleteSelected: () => {
        const state = get()
        if (!state.selection.length) return
        checkpoint()
        const removed = new Set(
          state.selection.flatMap((id) => [
            id,
            ...descendantsOf(id, state.nodes),
          ]),
        )
        set({
          nodes: Object.fromEntries(
            Object.entries(state.nodes).filter(([id]) => !removed.has(id)),
          ),
          order: state.order.filter((id) => !removed.has(id)),
          selection: [],
        })
      },
      duplicateSelected: () => {
        const state = get()
        if (!state.selection.length) return
        checkpoint()
        const ids = [
          ...new Set(
            state.selection.flatMap((id) => [
              id,
              ...descendantsOf(id, state.nodes),
            ]),
          ),
        ]
        const idMap = new Map(ids.map((id) => [id, crypto.randomUUID()]))
        const nodes = { ...state.nodes }
        const order = [...state.order]
        for (const id of ids) {
          const source = state.nodes[id]
          if (!source) continue
          const nextId = idMap.get(id)
          if (!nextId) continue
          nodes[nextId] = {
            ...source,
            id: nextId,
            name: `${source.name} copy`,
            parentId:
              source.parentId && idMap.has(source.parentId)
                ? (idMap.get(source.parentId) ?? source.parentId)
                : source.parentId,
            x: source.x + (state.selection.includes(id) ? 24 : 0),
            y: source.y + (state.selection.includes(id) ? 24 : 0),
          }
          order.push(nextId)
        }
        set({
          nodes,
          order,
          selection: state.selection.flatMap((id) => {
            const nextId = idMap.get(id)
            return nextId ? [nextId] : []
          }),
        })
      },
      beginGesture: () => {
        if (!get().gestureSnapshot) set({ gestureSnapshot: snapshot(get()) })
      },
      endGesture: () => {
        const state = get()
        if (!state.gestureSnapshot) return
        if (
          state.nodes !== state.gestureSnapshot.nodes ||
          state.order !== state.gestureSnapshot.order
        ) {
          set({
            history: [...state.history.slice(-79), state.gestureSnapshot],
            future: [],
            gestureSnapshot: null,
          })
        } else {
          set({ gestureSnapshot: null })
        }
      },
      moveSelection: (delta, snapToGrid = false) => {
        const state = get()
        const nodes = { ...state.nodes }
        for (const id of state.selection) {
          const node = nodes[id]
          if (!node || node.locked) continue
          nodes[id] = {
            ...node,
            x: snap(node.x + delta.x, snapToGrid),
            y: snap(node.y + delta.y, snapToGrid),
          }
        }
        set({ nodes })
      },
      resizeNode: (id, width, height, snapToGrid = false) => {
        const node = get().nodes[id]
        if (!node || node.locked) return
        set((state) => ({
          nodes: {
            ...state.nodes,
            [id]: {
              ...node,
              width: Math.max(24, snap(width, snapToGrid)),
              height: Math.max(18, snap(height, snapToGrid)),
            },
          },
        }))
      },
      toggleNodeHidden: (id) => {
        const node = get().nodes[id]
        if (node) get().updateNode(id, { hidden: !node.hidden })
      },
      toggleNodeLocked: (id) => {
        const node = get().nodes[id]
        if (node) get().updateNode(id, { locked: !node.locked })
      },
      reorderNode: (id, direction) => {
        const state = get()
        const index = state.order.indexOf(id)
        if (index < 0) return
        const node = state.nodes[id]
        if (!node) return
        const siblingIndexes = state.order
          .map((candidateId, candidateIndex) => ({
            candidateId,
            candidateIndex,
          }))
          .filter(
            ({ candidateId }) =>
              state.nodes[candidateId]?.parentId === node.parentId,
          )
          .map(({ candidateIndex }) => candidateIndex)
        const siblingPosition = siblingIndexes.indexOf(index)
        const target = siblingIndexes.at(siblingPosition + direction)
        if (target === undefined) return
        checkpoint()
        const order = [...state.order]
        ;[order[index], order[target]] = [order[target], order[index]]
        set({ order })
      },
      moveSelectedToEdge: (edge) => {
        const state = get()
        const selected = new Set(state.selection)
        if (!selected.size) return
        const parentIds = new Set(
          state.selection.map((id) => state.nodes[id]?.parentId ?? null),
        )
        const order = [...state.order]

        for (const parentId of parentIds) {
          const siblingIndexes = order
            .map((id, index) => ({ id, index }))
            .filter(({ id }) => state.nodes[id]?.parentId === parentId)
          const selectedSiblings = siblingIndexes.filter(({ id }) =>
            selected.has(id),
          )
          if (!selectedSiblings.length) continue
          const otherSiblings = siblingIndexes.filter(
            ({ id }) => !selected.has(id),
          )
          const nextSiblings =
            edge === 'front'
              ? [...otherSiblings, ...selectedSiblings]
              : [...selectedSiblings, ...otherSiblings]

          siblingIndexes.forEach(({ index }, siblingIndex) => {
            const nextId = nextSiblings[siblingIndex]?.id
            if (nextId && order[index] !== nextId) {
              order[index] = nextId
            }
          })
        }

        if (!order.some((id, index) => id !== state.order[index])) return
        checkpoint()
        set({ order })
      },
      setSelectedHidden: (hidden) => {
        const state = get()
        const ids = state.selection.filter((id) => {
          const node = state.nodes[id]
          return node && node.hidden !== hidden
        })
        if (!ids.length) return
        checkpoint()
        const nodes = { ...state.nodes }
        for (const id of ids) {
          const node = nodes[id]
          if (node) nodes[id] = { ...node, hidden }
        }
        set({ nodes })
      },
      setSelectedLocked: (locked) => {
        const state = get()
        const ids = state.selection.filter((id) => {
          const node = state.nodes[id]
          return node && node.locked !== locked
        })
        if (!ids.length) return
        checkpoint()
        const nodes = { ...state.nodes }
        for (const id of ids) {
          const node = nodes[id]
          if (node) nodes[id] = { ...node, locked }
        }
        set({ nodes })
      },
      undo: () => {
        const state = get()
        const previous = state.history.at(-1)
        if (!previous) return
        set({
          ...previous,
          history: state.history.slice(0, -1),
          future: [snapshot(state), ...state.future.slice(0, 79)],
          selection: state.selection.filter((id) =>
            Boolean(previous.nodes[id]),
          ),
        })
      },
      redo: () => {
        const state = get()
        const next = state.future.at(0)
        if (!next) return
        set({
          ...next,
          history: [...state.history.slice(-79), snapshot(state)],
          future: state.future.slice(1),
          selection: state.selection.filter((id) => Boolean(next.nodes[id])),
        })
      },
    }
  })
}

export type EditorStore = ReturnType<typeof createEditorStore>

const EditorStoreContext = createContext<EditorStore | null>(null)

export function EditorStoreProvider({
  children,
  documentId,
}: {
  children: ReactNode
  documentId: string
}) {
  const [store] = useState(() =>
    createEditorStore({
      ...initialDocument,
      id: documentId,
      title: documentId === 'demo' ? initialDocument.title : 'Untitled canvas',
    }),
  )
  return (
    <EditorStoreContext.Provider value={store}>
      {children}
    </EditorStoreContext.Provider>
  )
}

export function useEditorStore<T>(selector: (state: EditorState) => T): T {
  const store = useContext(EditorStoreContext)
  if (!store)
    throw new Error('useEditorStore must be used inside EditorStoreProvider')
  return useStore(store, selector)
}

export function useEditorStoreApi(): StoreApi<EditorState> {
  const store = useContext(EditorStoreContext)
  if (!store)
    throw new Error('useEditorStoreApi must be used inside EditorStoreProvider')
  return store
}
