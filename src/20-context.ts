interface Logger {
  log: (message: string) => void
}

interface Storage {
  save: (key: string, value: string) => void
  load: (key: string) => string | null
}

interface Context {
  logger: Logger
  storage: Storage
}

export function createLogger(): Logger {
  return {
    log: (message: string) => {
      console.log(`[LOG]: ${message}`)
    },
  }
}

export function createStorage(): Storage {
  const store: Record<string, string> = {}
  return {
    save: (key: string, value: string) => {
      store[key] = value
    },
    load: (key: string) => {
      return store[key] || null
    },
  }
}

interface Input<D, C extends Partial<Context>> {
  data: D
  context: C
}

type Output<S, E> = { tag: 'success'; data: S } | { tag: 'error'; error: E }

export type Computation<D, S, E, C extends Partial<Context>> = (
  input: Input<D, C>,
) => Output<S, E>

type ArrayNode = { tag: 'array'; value: Node[] }
type SingletonNode = { tag: 'singleton'; value: Node }
type NumberNode = { tag: 'number'; value: number }
type Node = ArrayNode | SingletonNode | NumberNode

const ArrayNodeFunc = {
  getChildren(node: ArrayNode): Node[] {
    return node.value
  },
}

const ContextFunc = {
  map<D, E, C extends Partial<Context>>(
    fn: (x: D) => E,
    input: Input<D, C>,
  ): Input<E, C> {
    return { data: fn(input.data), context: input.context }
  },
}

const exampleArrayNode: ArrayNode = {
  tag: 'array',
  value: [
    { tag: 'number', value: 1 },
    { tag: 'singleton', value: { tag: 'number', value: 2 } },
    { tag: 'array', value: [{ tag: 'number', value: 3 }] },
  ],
}

const exampleContext: Context = {
  logger: createLogger(),
  storage: createStorage(),
}

console.log(
  ContextFunc.map(ArrayNodeFunc.getChildren, {
    data: exampleArrayNode,
    context: exampleContext,
  }),
)
