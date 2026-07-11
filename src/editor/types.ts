export type NodeKind = 'frame' | 'text' | 'button' | 'shape' | 'image' | 'badge'

export type EditorTool = 'select' | 'hand' | NodeKind

export type FontFamily = 'display' | 'sans' | 'mono'

export interface CanvasStyle {
  background?: string
  color?: string
  borderColor?: string
  borderWidth?: number
  radius?: number
  fontFamily?: FontFamily
  fontSize?: number
  fontWeight?: number
  letterSpacing?: number
  lineHeight?: number
  textAlign?: 'left' | 'center' | 'right'
  shadow?: string
}

export interface CanvasNode {
  id: string
  name: string
  kind: NodeKind
  parentId: string | null
  x: number
  y: number
  width: number
  height: number
  rotation: number
  opacity: number
  hidden: boolean
  locked: boolean
  content?: string
  asset?: 'ceramic' | 'portrait' | 'texture'
  style: CanvasStyle
}

export type CanvasNodeMap = Record<string, CanvasNode | undefined>

export interface CanvasDocument {
  id: string
  title: string
  nodes: CanvasNodeMap
  order: string[]
}

export interface Point {
  x: number
  y: number
}

export interface Camera {
  x: number
  y: number
  zoom: number
}

export interface Collaborator {
  clientId: number
  userId: string
  name: string
  color: string
  image?: string | null
  isAnonymous: boolean
  cursor?: Point
  selection: string[]
}

export interface PresenceUser {
  userId: string
  name: string
  color: string
  image?: string | null
  isAnonymous: boolean
}

export type ConnectionStatus = 'offline' | 'connecting' | 'synced'
