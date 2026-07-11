import { describe, expect, it } from 'vitest'

import {
  getFrameAtPoint,
  getNodeWorldPoint,
  screenToWorld,
  zoomAroundPoint,
} from './geometry'
import type { CanvasNode } from './types'

const node = (
  patch: Partial<CanvasNode> & Pick<CanvasNode, 'id'>,
): CanvasNode => ({
  name: patch.id,
  kind: 'frame',
  parentId: null,
  x: 0,
  y: 0,
  width: 100,
  height: 100,
  rotation: 0,
  opacity: 1,
  hidden: false,
  locked: false,
  style: {},
  ...patch,
})

describe('canvas geometry', () => {
  it('converts screen coordinates into world coordinates', () => {
    expect(
      screenToWorld(
        { x: 310, y: 270 },
        { x: 100, y: 50, zoom: 2 },
        { left: 10, top: 20 },
      ),
    ).toEqual({ x: 100, y: 100 })
  })

  it('keeps the world point below the cursor stable while zooming', () => {
    const camera = { x: 80, y: 40, zoom: 0.5 }
    const anchor = { x: 400, y: 280 }
    const worldBefore = {
      x: (anchor.x - camera.x) / camera.zoom,
      y: (anchor.y - camera.y) / camera.zoom,
    }
    const next = zoomAroundPoint(camera, 1.25, anchor)
    expect((anchor.x - next.x) / next.zoom).toBeCloseTo(worldBefore.x)
    expect((anchor.y - next.y) / next.zoom).toBeCloseTo(worldBefore.y)
  })

  it('resolves nested node coordinates in world space', () => {
    const nodes = {
      parent: node({ id: 'parent', x: 200, y: 100 }),
      child: node({ id: 'child', parentId: 'parent', x: 30, y: 45 }),
    }
    expect(getNodeWorldPoint(nodes.child, nodes)).toEqual({ x: 230, y: 145 })
  })

  it('chooses the topmost eligible frame at a point', () => {
    const nodes = {
      back: node({ id: 'back', x: 0, y: 0, width: 300, height: 300 }),
      front: node({ id: 'front', x: 40, y: 40, width: 100, height: 100 }),
    }
    expect(
      getFrameAtPoint({ x: 80, y: 80 }, nodes, ['back', 'front'])?.id,
    ).toBe('front')
  })
})
