import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import YProvider from 'y-partyserver/provider'
import * as Y from 'yjs'

import {
  hasCollaborativeDocument,
  LOCAL_YJS_ORIGIN,
  readDocumentFromYDoc,
  writeDocumentToYDoc,
} from './collaboration-codec'
import { getPresenceColor } from '#/auth/identity'
import type { AuthIdentity } from '#/auth/identity'
import { useEditorStoreApi } from './store'
import type { Collaborator, Point, PresenceUser } from './types'

interface AwarenessUser extends PresenceUser {}

interface AwarenessState {
  user?: AwarenessUser
  cursor?: Point
  selection?: string[]
}

export function useCollaboration(documentId: string, identity: AuthIdentity) {
  const store = useEditorStoreApi()
  const providerRef = useRef<YProvider | null>(null)
  const cursorFrameRef = useRef<number | null>(null)
  const pendingCursorRef = useRef<Point | undefined>(undefined)
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const self = useMemo<AwarenessUser>(
    () => ({
      userId: identity.id,
      name: identity.name,
      color: getPresenceColor(identity.id),
      image: identity.image,
      isAnonymous: identity.isAnonymous,
    }),
    [identity.id, identity.image, identity.isAnonymous, identity.name],
  )

  useEffect(() => {
    const doc = new Y.Doc()
    store.getState().setConnectionStatus('connecting')

    const provider = new YProvider(window.location.host, documentId, doc, {
      party: 'canvas-room',
      protocol: window.location.protocol === 'https:' ? 'wss' : 'ws',
    })
    providerRef.current = provider
    provider.awareness.setLocalStateField('user', self)
    provider.awareness.setLocalStateField(
      'selection',
      store.getState().selection,
    )

    let synced = false
    let applyingRemote = false

    const updateCollaborators = () => {
      const next: Collaborator[] = []
      for (const [clientId, state] of provider.awareness.getStates() as Map<
        number,
        AwarenessState
      >) {
        if (clientId === doc.clientID || !state.user) continue
        next.push({
          clientId,
          userId: state.user.userId,
          name: state.user.name,
          color: state.user.color,
          image: state.user.image,
          isAnonymous: state.user.isAnonymous,
          cursor: state.cursor,
          selection: state.selection ?? [],
        })
      }
      setCollaborators(next)
    }

    const applyRemoteDocument = (transaction?: Y.Transaction) => {
      if (!synced || transaction?.origin === LOCAL_YJS_ORIGIN) return
      const remote = readDocumentFromYDoc(doc, documentId)
      if (!remote.order.length) return
      applyingRemote = true
      store
        .getState()
        .replaceScene({ nodes: remote.nodes, order: remote.order })
      store.getState().setTitle(remote.title)
      applyingRemote = false
    }

    const yNodes = doc.getMap<Y.Map<unknown>>('nodes')
    const yOrder = doc.getArray<string>('order')
    const yMeta = doc.getMap<string>('meta')
    yNodes.observeDeep((_events, transaction) =>
      applyRemoteDocument(transaction),
    )
    yOrder.observe((_event, transaction) => applyRemoteDocument(transaction))
    yMeta.observe((_event, transaction) => applyRemoteDocument(transaction))

    const handleSync = (isSynced: boolean) => {
      if (!isSynced) return
      synced = true
      if (hasCollaborativeDocument(doc)) {
        applyRemoteDocument()
      } else {
        const state = store.getState()
        writeDocumentToYDoc(doc, {
          title: state.title,
          nodes: state.nodes,
          order: state.order,
        })
      }
      store.getState().setConnectionStatus('synced')
    }

    const handleStatus = ({ status }: { status: string }) => {
      store
        .getState()
        .setConnectionStatus(
          status === 'connected' && synced
            ? 'synced'
            : status === 'connecting'
              ? 'connecting'
              : 'offline',
        )
    }

    provider.on('sync', handleSync)
    provider.on('status', handleStatus)
    provider.awareness.on('change', updateCollaborators)
    updateCollaborators()

    const unsubscribe = store.subscribe((state, previous) => {
      if (state.selection !== previous.selection) {
        provider.awareness.setLocalStateField('selection', state.selection)
      }
      if (!synced || applyingRemote) return
      if (
        state.nodes !== previous.nodes ||
        state.order !== previous.order ||
        state.title !== previous.title
      ) {
        writeDocumentToYDoc(doc, {
          title: state.title,
          nodes: state.nodes,
          order: state.order,
        })
      }
    })

    const connectionTimeout = window.setTimeout(() => {
      if (!synced) store.getState().setConnectionStatus('offline')
    }, 5000)

    return () => {
      window.clearTimeout(connectionTimeout)
      unsubscribe()
      provider.awareness.off('change', updateCollaborators)
      provider.off('sync', handleSync)
      provider.off('status', handleStatus)
      provider.destroy()
      doc.destroy()
      providerRef.current = null
    }
  }, [documentId, self, store])

  const updateCursor = useCallback((cursor?: Point) => {
    pendingCursorRef.current = cursor
    if (cursorFrameRef.current !== null) return
    cursorFrameRef.current = window.requestAnimationFrame(() => {
      providerRef.current?.awareness.setLocalStateField(
        'cursor',
        pendingCursorRef.current ?? null,
      )
      cursorFrameRef.current = null
    })
  }, [])

  return { collaborators, self, updateCursor }
}
