/**
 * Contains classes for classic scheme such as Node, Input, Output, Control, Socket, Connection
 * @module
 * @group Primary
 */

import { ConnectionBase, NodeBase } from '../types'
import { getUID } from '../utils'

type PortId = string

/**
 * The socket class
 * @priority 7
 */
export class Socket {
  /**
   * @constructor
   * @param name Name of the socket
   */
  constructor(public name: string) {

  }
}

/**
 * General port class
 */
export class Port<S extends Socket> {
  /**
   * Port id, unique string generated by `getUID` function
   */
  id: PortId
  /**
   * Port index, used for sorting ports. Default is `0`
   */
  index?: number

  /**
   * @constructor
   * @param socket Socket instance
   * @param label Label of the port
   * @param multipleConnections Whether the output port can have multiple connections
   */
  constructor(public socket: S, public label?: string, public multipleConnections?: boolean) {
    this.id = getUID()
  }
}

/**
 * The input port class
 * @priority 6
 */
export class Input<S extends Socket> extends Port<S> {
  /**
   * Control instance
   */
  control: Control | null = null
  /**
   * Whether the control is visible. Can be managed dynamically by extensions. Default is `true`
   */
  showControl = true

  /**
   * @constructor
   * @param socket Socket instance
   * @param label Label of the input port
   * @param multipleConnections Whether the output port can have multiple connections. Default is `false`
   */
  constructor(public socket: S, public label?: string, public multipleConnections?: boolean) {
    super(socket, label, multipleConnections)
  }

  /**
   * Add control to the input port
   * @param control Control instance
   */
  addControl(control: Control) {
    if (this.control) throw new Error('control already added for this input')
    this.control = control
  }

  /**
   * Remove control from the input port
   */
  removeControl() {
    this.control = null
  }
}

/**
 * The output port class
 * @priority 5
 */
export class Output<S extends Socket> extends Port<S> {
  /**
   * @constructor
   * @param socket Socket instance
   * @param label Label of the output port
   * @param multipleConnections Whether the output port can have multiple connections. Default is `true`
   */
  constructor(socket: S, label?: string, multipleConnections?: boolean) {
    super(socket, label, multipleConnections !== false)
  }
}

/**
 * General control class
 * @priority 5
 */
export class Control {
  /**
   * Control id, unique string generated by `getUID` function
   */
  id: string
  /**
   * Control index, used for sorting controls. Default is `0`
   */
  index?: number

  constructor() {
    this.id = getUID()
  }
}

/**
 * Input control options
 */
type InputControlOptions<N> = {
  /** Whether the control is readonly. Default is `false` */
  readonly?: boolean,
  /** Initial value of the control */
  initial?: N,
  /** Callback function that is called when the control value changes */
  change?: (value: N) => void
}
/**
 * The input control class
 * @example new InputControl('text', { readonly: true, initial: 'hello' })
 */
export class InputControl<T extends 'text' | 'number', N = T extends 'text' ? string : number> extends Control {
  value?: N
  readonly: boolean

  /**
   * @constructor
   * @param type Type of the control: `text` or `number`
   * @param options Control options
   */
  constructor(public type: T, public options?: InputControlOptions<N>) {
    super()
    this.id = getUID()
    this.readonly = options?.readonly

    if (typeof options?.initial !== 'undefined') this.value = options.initial
  }

  /**
   * Set control value
   * @param value Value to set
   */
  setValue(value?: N) {
    this.value = value
    if (this.options?.change) this.options.change(value)
  }
}

/**
 * The node class
 * @priority 10
 * @example new Node('math')
 */
export class Node<
  Inputs extends { [key in string]?: Socket } = { [key in string]?: Socket },
  Outputs extends { [key in string]?: Socket } = { [key in string]?: Socket },
  Controls extends { [key in string]?: Control } = { [key in string]?: Control }
> implements NodeBase {
  /**
   * Node id, unique string generated by `getUID` function
   */
  id: NodeBase['id']
  /**
   * Node inputs
   */
  inputs: { [key in keyof Inputs]?: Input<Exclude<Inputs[key], undefined>> } = {}
  /**
   * Node outputs
   */
  outputs: { [key in keyof Outputs]?: Output<Exclude<Outputs[key], undefined>> } = {}
  /**
   * Node controls
   */
  controls: Controls = {} as Controls
  /**
   * Whether the node is selected. Default is `false`
   */
  selected?: boolean

  constructor(public label: string) {
    this.id = getUID()
  }

  hasInput<K extends keyof Inputs>(key: K) {
    return Object.prototype.hasOwnProperty.call(this.inputs, key)
  }

  addInput<K extends keyof Inputs>(key: K, input: Input<Exclude<Inputs[K], undefined>>) {
    if (this.hasInput(key)) throw new Error(`input with key '${String(key)}' already added`)

    Object.defineProperty(this.inputs, key, { value: input, enumerable: true, configurable: true })
  }

  removeInput(key: keyof Inputs) {
    delete this.inputs[key]
  }

  hasOutput<K extends keyof Outputs>(key: K) {
    return Object.prototype.hasOwnProperty.call(this.outputs, key)
  }

  addOutput<K extends keyof Outputs>(key: K, output: Output<Exclude<Outputs[K], undefined>>) {
    if (this.hasOutput(key)) throw new Error(`output with key '${String(key)}' already added`)

    Object.defineProperty(this.outputs, key, { value: output, enumerable: true, configurable: true })
  }

  removeOutput(key: keyof Outputs) {
    delete this.outputs[key]
  }

  hasControl<K extends keyof Controls>(key: K) {
    return Object.prototype.hasOwnProperty.call(this.controls, key)
  }

  addControl<K extends keyof Controls>(key: K, control: Controls[K]) {
    if (this.hasControl(key)) throw new Error(`control with key '${String(key)}' already added`)

    Object.defineProperty(this.controls, key, { value: control, enumerable: true, configurable: true })
  }

  removeControl(key: keyof Controls) {
    delete this.controls[key]
  }
}

/**
 * The connection class
 * @priority 9
 */
export class Connection<
  Source extends Node,
  Target extends Node
> implements ConnectionBase {
  /**
   * Connection id, unique string generated by `getUID` function
   */
  id: ConnectionBase['id']
  /**
   * Source node id
   */
  source: NodeBase['id']
  /**
   * Target node id
   */
  target: NodeBase['id']

  /**
   * @constructor
   * @param source Source node instance
   * @param sourceOutput Source node output key
   * @param target Target node instance
   * @param targetInput Target node input key
   */
  constructor(
    source: Source,
    public sourceOutput: keyof Source['outputs'],
    target: Target,
    public targetInput: keyof Target['inputs']
  ) {
    if (!source.outputs[sourceOutput as string]) {
      throw new Error(`source node doesn't have output with a key ${String(sourceOutput)}`)
    }
    if (!target.inputs[targetInput as string]) {
      throw new Error(`target node doesn't have input with a key ${String(targetInput)}`)
    }

    this.id = getUID()
    this.source = source.id
    this.target = target.id
  }
}
