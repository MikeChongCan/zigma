import type { CanvasNode, CanvasNodeMap } from './types'

export type ExportFormat = 'png' | 'jpeg' | 'svg' | 'pdf'
export type ExportScope = 'selection' | 'all'

export interface ExportFrame {
  id: string
  name: string
  width: number
  height: number
}

function getTopLevelId(id: string, nodes: CanvasNodeMap): string | null {
  const initialNode = nodes[id]
  if (!initialNode || initialNode.hidden) return null
  let current: CanvasNode = initialNode

  const visited = new Set<string>()
  while (current.parentId) {
    if (visited.has(current.id)) return null
    visited.add(current.id)
    const parent: CanvasNode | undefined = nodes[current.parentId]
    if (!parent || parent.hidden) return null
    current = parent
  }

  return current.kind === 'frame' ? current.id : null
}

export function getExportFrames(
  nodes: CanvasNodeMap,
  order: string[],
  selection: string[],
  scope: ExportScope,
): ExportFrame[] {
  const selectedRoots = new Set(
    selection.flatMap((id) => {
      const rootId = getTopLevelId(id, nodes)
      return rootId ? [rootId] : []
    }),
  )

  const frameIds =
    scope === 'selection' && selectedRoots.size
      ? order.filter((id) => selectedRoots.has(id))
      : order.filter((id) => {
          const node = nodes[id]
          return Boolean(
            node && !node.parentId && node.kind === 'frame' && !node.hidden,
          )
        })

  return frameIds.flatMap((id) => {
    const node = nodes[id]
    return node
      ? [{ id, name: node.name, width: node.width, height: node.height }]
      : []
  })
}

export function sanitizeExportName(value: string): string {
  const normalized = value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
  return normalized || 'zigma-export'
}

export function getExportFilename(
  documentTitle: string,
  frameName: string | undefined,
  extension: string,
): string {
  const parts = [documentTitle, frameName]
    .filter((value): value is string => Boolean(value))
    .map(sanitizeExportName)
  return `${parts.join('-') || 'zigma-export'}.${extension}`
}
