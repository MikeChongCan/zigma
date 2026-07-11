import type { CanvasNode, NodeKind, Point } from './types'

export const makeNode = (
  node: Omit<
    CanvasNode,
    'rotation' | 'opacity' | 'hidden' | 'locked' | 'style'
  > &
    Partial<
      Pick<CanvasNode, 'rotation' | 'opacity' | 'hidden' | 'locked' | 'style'>
    >,
): CanvasNode => ({
  rotation: 0,
  opacity: 1,
  hidden: false,
  locked: false,
  style: {},
  ...node,
})

const nodeDefaults: Record<
  NodeKind,
  Pick<CanvasNode, 'name' | 'width' | 'height' | 'content' | 'style'>
> = {
  frame: {
    name: 'New frame',
    width: 720,
    height: 480,
    style: { background: '#f3efe6', borderColor: '#d8d1c5', borderWidth: 1 },
  },
  text: {
    name: 'Text',
    width: 240,
    height: 64,
    content: 'Write something precise.',
    style: {
      color: '#171815',
      fontFamily: 'display',
      fontSize: 32,
      fontWeight: 460,
      lineHeight: 1.05,
    },
  },
  button: {
    name: 'Button',
    width: 156,
    height: 48,
    content: 'Take action',
    style: {
      background: '#e95c35',
      color: '#fffaf1',
      radius: 3,
      fontFamily: 'sans',
      fontSize: 13,
      fontWeight: 720,
    },
  },
  shape: {
    name: 'Rectangle',
    width: 180,
    height: 140,
    style: { background: '#a9b276', radius: 3 },
  },
  image: {
    name: 'Image',
    width: 320,
    height: 420,
    style: { background: '#796e5d', radius: 8 },
  },
  badge: {
    name: 'Badge',
    width: 112,
    height: 34,
    content: 'NEW EDIT',
    style: {
      background: '#171815',
      color: '#f3efe6',
      radius: 999,
      fontFamily: 'mono',
      fontSize: 10,
      fontWeight: 600,
    },
  },
}

export function createCanvasNode(
  kind: NodeKind,
  point: Point,
  parentId: string | null,
): CanvasNode {
  const defaults = nodeDefaults[kind]
  return makeNode({
    id: crypto.randomUUID(),
    kind,
    parentId,
    x: point.x,
    y: point.y,
    ...defaults,
    asset: kind === 'image' ? 'texture' : undefined,
  })
}
