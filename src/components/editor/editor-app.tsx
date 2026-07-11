import { useEffect } from 'react'

import type { AuthIdentity } from '#/auth/identity'
import { StudioAuthGate } from '#/components/auth/studio-auth-gate'
import type { AuthCapabilities } from '#/components/auth/studio-auth-gate'
import { EditorStoreProvider, useEditorStore } from '#/editor/store'
import { useCollaboration } from '#/editor/use-collaboration'
import { useEditorShortcuts } from '#/editor/use-editor-shortcuts'

import { EditorCanvas } from './editor-canvas'
import { EditorHeader } from './editor-header'
import { InspectorPanel } from './inspector-panel'
import { LayersPanel } from './layers-panel'

export function EditorApp({ documentId }: { documentId: string }) {
  return (
    <StudioAuthGate>
      {(identity, capabilities) => (
        <EditorStoreProvider documentId={documentId}>
          <EditorWorkspace
            documentId={documentId}
            identity={identity}
            capabilities={capabilities}
          />
        </EditorStoreProvider>
      )}
    </StudioAuthGate>
  )
}

function EditorWorkspace({
  documentId,
  identity,
  capabilities,
}: {
  documentId: string
  identity: AuthIdentity
  capabilities: AuthCapabilities
}) {
  useEditorShortcuts()
  const { collaborators, self, updateCursor } = useCollaboration(
    documentId,
    identity,
  )
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
      <EditorHeader
        collaborators={collaborators}
        self={self}
        capabilities={capabilities}
      />
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
