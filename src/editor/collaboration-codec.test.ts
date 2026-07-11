import { describe, expect, it } from 'vitest'
import * as Y from 'yjs'

import {
  hasCollaborativeDocument,
  readDocumentFromYDoc,
  writeDocumentToYDoc,
} from './collaboration-codec'
import type { CanvasDocument } from './types'

const document: CanvasDocument = {
  id: 'room',
  title: 'Shared scene',
  order: ['heading'],
  nodes: {
    heading: {
      id: 'heading',
      name: 'Heading',
      kind: 'text',
      parentId: null,
      x: 40,
      y: 80,
      width: 300,
      height: 90,
      rotation: 0,
      opacity: 0.9,
      hidden: false,
      locked: false,
      content: 'Shared words',
      style: { color: '#123456', fontFamily: 'display', fontSize: 48 },
    },
  },
}

describe('collaboration codec', () => {
  it('round-trips structured nodes through Yjs shared types', () => {
    const doc = new Y.Doc()
    writeDocumentToYDoc(doc, document)
    expect(hasCollaborativeDocument(doc)).toBe(true)
    expect(readDocumentFromYDoc(doc, 'room')).toEqual(document)
  })

  it('synchronizes updates into a second document', () => {
    const first = new Y.Doc()
    const second = new Y.Doc()
    first.on('update', (update) => Y.applyUpdate(second, update))
    writeDocumentToYDoc(first, document)
    const remote = readDocumentFromYDoc(second, 'room')
    expect(remote.nodes.heading?.content).toBe('Shared words')
    expect(remote.nodes.heading?.style.fontSize).toBe(48)
  })
})
