import { Scope } from './scope'
import { BaseSchemes, NodeEditorData } from './types'

export type Root<Scheme extends BaseSchemes> =
  | { type: 'nodecreate', data: Scheme['Node'] }
  | { type: 'nodecreated', data: Scheme['Node'] }
  | { type: 'noderemove', data: Scheme['Node'] }
  | { type: 'noderemoved', data: Scheme['Node'] }
  | { type: 'connectioncreate', data: Scheme['Connection'] }
  | { type: 'connectioncreated', data: Scheme['Connection'] }
  | { type: 'connectionremove', data: Scheme['Connection'] }
  | { type: 'connectionremoved', data: Scheme['Connection'] }
  | { type: 'clear' }
  | { type: 'clearcancelled' }
  | { type: 'cleared' }
  | { type: 'import', data: NodeEditorData<Scheme> }
  | { type: 'imported', data: NodeEditorData<Scheme> }
  | { type: 'export', data: NodeEditorData<Scheme> }
  | { type: 'exported', data: NodeEditorData<Scheme> }

export class NodeEditor<Scheme extends BaseSchemes> extends Scope<Root<Scheme>> {
  private nodes: Scheme['Node'][] = []
  private connections: Scheme['Connection'][] = []

  constructor() {
    super('NodeEditor')
  }

  public getNode(id: Scheme['Node']['id']) {
    return this.nodes.find(node => node.id === id)
  }

  public getNodes() {
    return this.nodes
  }

  public getConnections() {
    return this.connections
  }

  public getConnection(id: Scheme['Connection']['id']) {
    return this.connections.find(connection => connection.id === id)
  }

  async addNode(data: Scheme['Node']) {
    if (this.getNode(data.id)) throw new Error('node has already been added')

    if (!await this.emit({ type: 'nodecreate', data })) return false

    this.nodes.push(data)

    await this.emit({ type: 'nodecreated', data })
    return true
  }

  async addConnection(data: Scheme['Connection']) {
    if (this.getConnection(data.id)) throw new Error('connection has already been added')

    if (!await this.emit({ type: 'connectioncreate', data })) return false

    this.connections.push(data)

    await this.emit({ type: 'connectioncreated', data })
    return true
  }

  async removeNode(id: Scheme['Node']['id']) {
    const index = this.nodes.findIndex(n => n.id === id)
    const node = this.nodes[index]

    if (index < 0) throw new Error('cannot find node')

    if (!await this.emit({ type: 'noderemove', data: node })) return false

    this.nodes.splice(index, 1)

    await this.emit({ type: 'noderemoved', data: node })
    return true
  }

  async removeConnection(id: Scheme['Connection']['id']) {
    const index = this.connections.findIndex(n => n.id === id)
    const connection = this.connections[index]

    if (index < 0) throw new Error('cannot find connection')

    if (!await this.emit({ type: 'connectionremove', data: connection })) return false

    this.connections.splice(index, 1)

    await this.emit({ type: 'connectionremoved', data: connection })
    return true
  }

  async clear() {
    if (!await this.emit({ type: 'clear' })) {
      await this.emit({ type: 'clearcancelled' })
      return false
    }

    for (const connection of this.connections.slice()) await this.removeConnection(connection.id)
    for (const node of this.nodes.slice()) await this.removeNode(node.id)

    await this.emit({ type: 'cleared' })
    return true
  }

  async import(data: NodeEditorData<Scheme>): Promise<boolean> {
    if (!await this.emit({ type: 'import', data })) return false

    for (const node of data.nodes) await this.addNode(node)
    for (const connection of data.connections) await this.addConnection(connection)

    await this.emit({ type: 'imported', data })

    return true
  }

  async export(): Promise<NodeEditorData<Scheme> | false> {
    const data: NodeEditorData<Scheme> = { nodes: [], connections: [] }

    if (!await this.emit({ type: 'export', data })) return false

    data.nodes.push(...this.nodes)
    data.connections.push(...this.connections)

    await this.emit({ type: 'exported', data })

    return data
  }
}