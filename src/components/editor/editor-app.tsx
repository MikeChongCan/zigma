import { useEffect } from 'react'

import { EditorStoreProvider, useEditorStore } from '#/editor/store'
import { useCollaboration } from '#/editor/use-collaboration'
import { useEditorShortcuts } from '#/editor/use-editor-shortcuts'

import { EditorCanvas } from './editor-canvas'
import { EditorHeader } from './editor-header'
import { InspectorPanel } from './inspector-panel'
import { LayersPanel } from './layers-panel'

export function EditorApp({ documentId }: { documentId: string }) {
  return (
    <EditorStoreProvider documentId={documentId}>
      <EditorWorkspace documentId={documentId} />
    </EditorStoreProvider>
  )
}

function EditorWorkspace({ documentId }: { documentId: string }) {
  useEditorShortcuts()
  const { collaborators, self, updateCursor } = useCollaboration(documentId)
  const leftPanelOpen = useEditorStore((state) => state.leftPanelOpen)
  const rightPanelOpen = useEditorStore((state) => state.rightPanelOpen)
  const setPanelOpen = useEditorStore((state) => state.setPanelOpen)

  useEffect(() => {
    if (window.matchMedia('(max-width: 760px)').matches) {
      setPanelOpen('left', false)
      setPanelOpen('right', false)
    }
  }, [setPanelOpen])

  return (
    <div
      className="editor-app"
      data-left-panel={leftPanelOpen}
      data-right-panel={rightPanelOpen}
    >
      <EditorHeader collaborators={collaborators} self={self} />
      <div className="editor-body">
        {leftPanelOpen && <LayersPanel />}
        <EditorCanvas
          collaborators={collaborators}
          updateCursor={updateCursor}
        />
        {rightPanelOpen && <InspectorPanel />}
      </div>
    </div>
  )
}
