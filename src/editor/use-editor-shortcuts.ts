import { useEffect } from 'react'

import { useEditorStoreApi } from './store'
import type { EditorTool } from './types'

const toolKeys: Partial<Record<string, EditorTool>> = {
  v: 'select',
  h: 'hand',
  f: 'frame',
  t: 'text',
  r: 'shape',
  b: 'button',
  i: 'image',
}

function isTypingTarget(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable ||
      ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
  )
}

export function useEditorShortcuts() {
  const store = useEditorStoreApi()

  useEffect(() => {
    let toolBeforeSpace: EditorTool | null = null

    const onKeyDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) return
      const state = store.getState()
      const command = event.metaKey || event.ctrlKey

      if (command && event.key.toLowerCase() === 'z') {
        event.preventDefault()
        if (event.shiftKey) state.redo()
        else state.undo()
        return
      }
      if (command && event.key.toLowerCase() === 'd') {
        event.preventDefault()
        state.duplicateSelected()
        return
      }
      if (command && event.key.toLowerCase() === 'a') {
        event.preventDefault()
        state.setSelection(
          state.order.filter((id) => {
            const node = state.nodes[id]
            return node ? !node.hidden : false
          }),
        )
        return
      }
      if (event.key === 'Backspace' || event.key === 'Delete') {
        event.preventDefault()
        state.deleteSelected()
        return
      }
      if (event.key === 'Escape') {
        state.setTool('select')
        state.setSelection([])
        return
      }
      if (event.key === ' ' && !event.repeat) {
        event.preventDefault()
        toolBeforeSpace = state.tool
        state.setTool('hand')
        return
      }
      const firstSelected = state.selection.at(0)
      if (event.key === '[' && firstSelected) {
        state.reorderNode(firstSelected, -1)
        return
      }
      if (event.key === ']' && firstSelected) {
        state.reorderNode(firstSelected, 1)
        return
      }
      if (event.key.startsWith('Arrow') && state.selection.length) {
        event.preventDefault()
        const distance = event.shiftKey ? 10 : 1
        const delta = {
          x:
            event.key === 'ArrowLeft'
              ? -distance
              : event.key === 'ArrowRight'
                ? distance
                : 0,
          y:
            event.key === 'ArrowUp'
              ? -distance
              : event.key === 'ArrowDown'
                ? distance
                : 0,
        }
        state.beginGesture()
        state.moveSelection(delta)
        state.endGesture()
        return
      }

      const tool = toolKeys[event.key.toLowerCase()]
      if (tool && !command) state.setTool(tool)
    }

    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key === ' ' && toolBeforeSpace) {
        store.getState().setTool(toolBeforeSpace)
        toolBeforeSpace = null
      }
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [store])
}
