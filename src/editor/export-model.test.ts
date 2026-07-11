import { describe, expect, it } from 'vitest'

import { getExportFilename, getExportFrames } from './export-model'
import type { CanvasNode } from './types'

const node = (
  patch: Partial<CanvasNode> & Pick<CanvasNode, 'id' | 'kind'>,
): CanvasNode => ({
  name: patch.id,
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

describe('export model', () => {
  const nodes = {
    frameA: node({ id: 'frameA', kind: 'frame', name: 'Desktop' }),
    heading: node({
      id: 'heading',
      kind: 'text',
      parentId: 'frameA',
    }),
    frameB: node({ id: 'frameB', kind: 'frame', name: 'Mobile' }),
    hidden: node({ id: 'hidden', kind: 'frame', hidden: true }),
  }
  const order = ['frameB', 'heading', 'hidden', 'frameA']

  it('resolves selected descendants to their top-level frames', () => {
    expect(getExportFrames(nodes, order, ['heading'], 'selection')).toEqual([
      expect.objectContaining({ id: 'frameA', name: 'Desktop' }),
    ])
  })

  it('exports visible frames in document order', () => {
    expect(
      getExportFrames(nodes, order, [], 'all').map(({ id }) => id),
    ).toEqual(['frameB', 'frameA'])
  })

  it('builds filesystem-safe filenames', () => {
    expect(getExportFilename('Northwind Launch', 'Mobile / 01', 'png')).toBe(
      'northwind-launch-mobile-01.png',
    )
    expect(getExportFilename('', '', 'svg')).toBe('zigma-export.svg')
  })
})
