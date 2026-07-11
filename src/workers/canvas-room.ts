import { YServer } from 'y-partyserver'
import * as Y from 'yjs'

const SNAPSHOT_KEY = 'canvas-yjs-snapshot'

export class CanvasRoom extends YServer {
  static options = { hibernate: true }

  static callbackOptions = {
    debounceWait: 1200,
    debounceMaxWait: 5000,
    timeout: 5000,
  }

  async onLoad() {
    const snapshot = await this.ctx.storage.get<ArrayBuffer>(SNAPSHOT_KEY)
    if (snapshot) Y.applyUpdate(this.document, new Uint8Array(snapshot))
  }

  async onSave() {
    const snapshot = Y.encodeStateAsUpdate(this.document)
    await this.ctx.storage.put(SNAPSHOT_KEY, snapshot.buffer)
  }
}
