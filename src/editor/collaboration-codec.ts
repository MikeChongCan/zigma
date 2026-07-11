import * as Y from 'yjs'

import type { CanvasDocument, CanvasNode, CanvasStyle } from './types'

export const LOCAL_YJS_ORIGIN = Symbol('canvas-pro-local-change')

const nodeFields = [
  'id',
  'name',
  'kind',
  'parentId',
  'x',
  'y',
  'width',
  'height',
  'rotation',
  'opacity',
  'hidden',
  'locked',
  'content',
  'asset',
] as const

const styleFields = [
  'background',
  'color',
  'borderColor',
  'borderWidth',
  'radius',
  'fontFamily',
  'fontSize',
  'fontWeight',
  'letterSpacing',
  'lineHeight',
  'textAlign',
  'shadow',
] as const

function setOrDelete(map: Y.Map<unknown>, key: string, value: unknown) {
  if (value === undefined) {
    if (map.has(key)) map.delete(key)
    return
  }
  if (map.get(key) !== value) map.set(key, value)
}

function ensureNodeMap(nodes: Y.Map<Y.Map<unknown>>, id: string) {
  const existing = nodes.get(id)
  if (existing) return existing
  const created = new Y.Map<unknown>()
  nodes.set(id, created)
  return created
}

export function writeDocumentToYDoc(
  doc: Y.Doc,
  document: Pick<CanvasDocument, 'title' | 'nodes' | 'order'>,
) {
  const yNodes = doc.getMap<Y.Map<unknown>>('nodes')
  const yOrder = doc.getArray<string>('order')
  const yMeta = doc.getMap<string>('meta')

  doc.transact(() => {
    for (const [id, node] of Object.entries(document.nodes)) {
      if (!node) continue
      const yNode = ensureNodeMap(yNodes, id)
      for (const field of nodeFields) setOrDelete(yNode, field, node[field])

      const currentStyle = yNode.get('style')
      const yStyle =
        currentStyle instanceof Y.Map ? currentStyle : new Y.Map<unknown>()
      if (!(currentStyle instanceof Y.Map)) yNode.set('style', yStyle)
      for (const field of styleFields)
        setOrDelete(yStyle, field, node.style[field])
    }

    for (const id of yNodes.keys()) {
      if (!document.nodes[id]) yNodes.delete(id)
    }

    const currentOrder = yOrder.toArray()
    if (
      currentOrder.length !== document.order.length ||
      currentOrder.some((id, index) => id !== document.order[index])
    ) {
      yOrder.delete(0, yOrder.length)
      yOrder.insert(0, document.order)
    }

    if (yMeta.get('title') !== document.title)
      yMeta.set('title', document.title)
  }, LOCAL_YJS_ORIGIN)
}

export function readDocumentFromYDoc(
  doc: Y.Doc,
  fallbackId: string,
): CanvasDocument {
  const yNodes = doc.getMap<Y.Map<unknown>>('nodes')
  const yOrder = doc.getArray<string>('order')
  const yMeta = doc.getMap<string>('meta')
  const nodes: Record<string, CanvasNode> = {}

  for (const [id, yNode] of yNodes.entries()) {
    const styleValue = yNode.get('style')
    const style: CanvasStyle = {}
    if (styleValue instanceof Y.Map) {
      for (const field of styleFields) {
        const value = styleValue.get(field)
        if (value !== undefined) Object.assign(style, { [field]: value })
      }
    }

    nodes[id] = {
      id,
      name: String(yNode.get('name') ?? 'Untitled layer'),
      kind: (yNode.get('kind') ?? 'shape') as CanvasNode['kind'],
      parentId: (yNode.get('parentId') ?? null) as string | null,
      x: Number(yNode.get('x') ?? 0),
      y: Number(yNode.get('y') ?? 0),
      width: Number(yNode.get('width') ?? 100),
      height: Number(yNode.get('height') ?? 100),
      rotation: Number(yNode.get('rotation') ?? 0),
      opacity: Number(yNode.get('opacity') ?? 1),
      hidden: Boolean(yNode.get('hidden')),
      locked: Boolean(yNode.get('locked')),
      content: yNode.get('content') as string | undefined,
      asset: yNode.get('asset') as CanvasNode['asset'],
      style,
    }
  }

  const order = yOrder.toArray().filter((id) => Boolean(nodes[id]))
  for (const id of Object.keys(nodes)) {
    if (!order.includes(id)) order.push(id)
  }

  return {
    id: fallbackId,
    title: yMeta.get('title') ?? 'Untitled canvas',
    nodes,
    order,
  }
}

export function hasCollaborativeDocument(doc: Y.Doc) {
  return doc.getMap('nodes').size > 0
}
