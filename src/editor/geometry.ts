import type { Camera, CanvasNode, CanvasNodeMap, Point } from './types'

export const MIN_ZOOM = 0.12
export const MAX_ZOOM = 3.5

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export function clampZoom(zoom: number) {
  return clamp(zoom, MIN_ZOOM, MAX_ZOOM)
}

export function screenToWorld(
  point: Point,
  camera: Camera,
  viewport: DOMRect | Pick<DOMRect, 'left' | 'top'>,
): Point {
  return {
    x: (point.x - viewport.left - camera.x) / camera.zoom,
    y: (point.y - viewport.top - camera.y) / camera.zoom,
  }
}

export function worldToScreen(point: Point, camera: Camera): Point {
  return {
    x: point.x * camera.zoom + camera.x,
    y: point.y * camera.zoom + camera.y,
  }
}

export function zoomAroundPoint(
  camera: Camera,
  nextZoom: number,
  screenPoint: Point,
): Camera {
  const zoom = clampZoom(nextZoom)
  const worldX = (screenPoint.x - camera.x) / camera.zoom
  const worldY = (screenPoint.y - camera.y) / camera.zoom
  return {
    x: screenPoint.x - worldX * zoom,
    y: screenPoint.y - worldY * zoom,
    zoom,
  }
}

export function getNodeWorldPoint(
  node: CanvasNode,
  nodes: CanvasNodeMap,
): Point {
  let x = node.x
  let y = node.y
  let parentId = node.parentId
  const visited = new Set<string>([node.id])

  while (parentId) {
    if (visited.has(parentId)) break
    visited.add(parentId)
    const parent = nodes[parentId]
    if (!parent) break
    x += parent.x
    y += parent.y
    parentId = parent.parentId
  }

  return { x, y }
}

export function getFrameAtPoint(
  point: Point,
  nodes: CanvasNodeMap,
  order: string[],
): CanvasNode | undefined {
  return [...order]
    .reverse()
    .map((id) => nodes[id])
    .find((node) => {
      if (!node || node.kind !== 'frame' || node.hidden || node.locked)
        return false
      const world = getNodeWorldPoint(node, nodes)
      return (
        point.x >= world.x &&
        point.x <= world.x + node.width &&
        point.y >= world.y &&
        point.y <= world.y + node.height
      )
    })
}

export function pointRelativeToParent(
  point: Point,
  parent: CanvasNode | undefined,
  nodes: CanvasNodeMap,
): Point {
  if (!parent) return point
  const parentWorld = getNodeWorldPoint(parent, nodes)
  return { x: point.x - parentWorld.x, y: point.y - parentWorld.y }
}

export function snap(value: number, enabled: boolean, size = 8) {
  return enabled ? Math.round(value / size) * size : value
}

export function descendantsOf(id: string, nodes: CanvasNodeMap): string[] {
  const result: string[] = []
  const queue = [id]
  while (queue.length) {
    const parentId = queue.shift()
    for (const node of Object.values(nodes)) {
      if (!node) continue
      if (node.parentId === parentId) {
        result.push(node.id)
        queue.push(node.id)
      }
    }
  }
  return result
}
