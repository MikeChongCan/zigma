import { describe, expect, it } from 'vitest'

import { createEditorStore } from './store'
import type { CanvasDocument, CanvasNode } from './types'

const shape: CanvasNode = {
  id: 'shape-1',
  name: 'Shape',
  kind: 'shape',
  parentId: null,
  x: 10,
  y: 20,
  width: 100,
  height: 80,
  rotation: 0,
  opacity: 1,
  hidden: false,
  locked: false,
  style: { background: '#fff' },
}

const document: CanvasDocument = {
  id: 'test',
  title: 'Test',
  nodes: { [shape.id]: shape },
  order: [shape.id],
}

describe('editor store', () => {
  it('groups a pointer gesture into one undo step', () => {
    const store = createEditorStore(document)
    store.getState().setSelection(['shape-1'])
    store.getState().beginGesture()
    store.getState().moveSelection({ x: 5, y: 0 })
    store.getState().moveSelection({ x: 5, y: 0 })
    store.getState().endGesture()

    expect(store.getState().nodes['shape-1']?.x).toBe(20)
    expect(store.getState().history).toHaveLength(1)
    store.getState().undo()
    expect(store.getState().nodes['shape-1']?.x).toBe(10)
  })

  it('restores added nodes through undo and redo', () => {
    const store = createEditorStore(document)
    const id = store.getState().addNode('text', { x: 500, y: 500 })
    expect(store.getState().nodes[id]).toBeDefined()
    store.getState().undo()
    expect(store.getState().nodes[id]).toBeUndefined()
    store.getState().redo()
    expect(store.getState().nodes[id]).toBeDefined()
  })

  it('removes descendants with their selected parent', () => {
    const child = { ...shape, id: 'child', parentId: 'shape-1' }
    const store = createEditorStore({
      ...document,
      nodes: { 'shape-1': shape, child },
      order: ['shape-1', 'child'],
    })
    store.getState().setSelection(['shape-1'])
    store.getState().deleteSelected()
    expect(store.getState().order).toEqual([])
    expect(store.getState().nodes).toEqual({})
  })

  it('moves selected siblings to the front as one undoable action', () => {
    const second = { ...shape, id: 'shape-2', name: 'Second' }
    const third = { ...shape, id: 'shape-3', name: 'Third' }
    const store = createEditorStore({
      ...document,
      nodes: { 'shape-1': shape, 'shape-2': second, 'shape-3': third },
      order: ['shape-1', 'shape-2', 'shape-3'],
    })
    store.getState().setSelection(['shape-1', 'shape-2'])
    store.getState().moveSelectedToEdge('front')

    expect(store.getState().order).toEqual(['shape-3', 'shape-1', 'shape-2'])
    expect(store.getState().history).toHaveLength(1)
    store.getState().undo()
    expect(store.getState().order).toEqual(['shape-1', 'shape-2', 'shape-3'])
  })

  it('locks a multi-selection with one history checkpoint', () => {
    const second = { ...shape, id: 'shape-2', name: 'Second' }
    const store = createEditorStore({
      ...document,
      nodes: { 'shape-1': shape, 'shape-2': second },
      order: ['shape-1', 'shape-2'],
    })
    store.getState().setSelection(['shape-1', 'shape-2'])
    store.getState().setSelectedLocked(true)

    expect(store.getState().nodes['shape-1']?.locked).toBe(true)
    expect(store.getState().nodes['shape-2']?.locked).toBe(true)
    expect(store.getState().history).toHaveLength(1)
  })
})
