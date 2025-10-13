type Branded<K, T> = K & { __brand: T }
type Key = Branded<string, 'Key'>

interface Node {
  key: Key
}

interface Input<D, T> {
  data: D
  type: T
}

interface NodeType {
  foo(key: Input<Node, this>): void
}

function loadType(node: Node): Input<Node, NodeType> | null {
  return {
    type: {
      foo({ data: { key } }) {
        console.log(key)
      },
    },
    data: node,
  }
}

const key = 'myKey' as Key

const exampleInput = { key }

export function doesNotWork() {
  // @ts-expect-error (Type is missing)
  obj.foo(exampleInput)
}

function checkType(node: Node): { foo(): void } | null {
  const input = loadType(node)

  if (!input) return null

  return {
    foo() {
      input.type.foo(input)
    },
  }
}

checkType(exampleInput)?.foo()
