import {
  BoxSelect,
  Frame,
  Hand,
  Image,
  MousePointer2,
  RectangleHorizontal,
  Type,
} from 'lucide-react'

import { useEditorStore } from '#/editor/store'
import type { EditorTool } from '#/editor/types'

const tools: Array<{
  id: EditorTool
  label: string
  key: string
  icon: typeof MousePointer2
}> = [
  { id: 'select', label: 'Select', key: 'V', icon: MousePointer2 },
  { id: 'hand', label: 'Hand', key: 'H', icon: Hand },
  { id: 'frame', label: 'Frame', key: 'F', icon: Frame },
  { id: 'text', label: 'Text', key: 'T', icon: Type },
  { id: 'shape', label: 'Rectangle', key: 'R', icon: RectangleHorizontal },
  { id: 'button', label: 'Button', key: 'B', icon: BoxSelect },
  { id: 'image', label: 'Image', key: 'I', icon: Image },
]

export function EditorToolbar() {
  const activeTool = useEditorStore((state) => state.tool)
  const setTool = useEditorStore((state) => state.setTool)

  return (
    <div className="editor-toolbar" aria-label="Canvas tools">
      {tools.map(({ id, label, key, icon: Icon }, index) => (
        <div
          className={index === 2 ? 'tool-divider-before' : undefined}
          key={id}
        >
          <button
            className="tool-button"
            data-active={activeTool === id}
            type="button"
            aria-label={`${label} (${key})`}
            title={`${label} · ${key}`}
            onClick={() => setTool(id)}
          >
            <Icon size={17} strokeWidth={1.8} />
            <span className="tool-key">{key}</span>
          </button>
        </div>
      ))}
    </div>
  )
}
