interface StringNodeSpec {
  type: 'string'
}

interface ArrayNodeSpec {
  type: 'array'
  items: NodeSpec
}

type NodeSpec = StringNodeSpec | ArrayNodeSpec

const stringNodeSpec: StringNodeSpec = {
  type: 'string',
}

const arrayNodeSpec: ArrayNodeSpec = {
  type: 'array',
  items: stringNodeSpec,
}

interface NestedNode<S extends NodeSpec = NodeSpec> {
  spec: S
  value: S extends StringNodeSpec
    ? string
    : S extends ArrayNodeSpec
      ? Array<NestedNode<S['items']>>
      : never
}

const exampleNode: NestedNode = {
  spec: arrayNodeSpec,
  value: [
    { spec: stringNodeSpec, value: 'hello' },
    { spec: stringNodeSpec, value: 'world' },
  ],
}

function isNodeKind<S extends NodeSpec, K extends S['type']>(
  kind: K,
  node: NestedNode<S>,
): node is NestedNode<Extract<S, { type: K }>> {
  return node.spec.type === kind
}

function logNodeValue(node: NestedNode): void {
  if (isNodeKind('string', node)) {
    console.log('String value:', node.value)
  } else if (isNodeKind('array', node)) {
    console.log('Array value:')
    node.value.forEach((childNode) => {
      logNodeValue(childNode)
    })
  }
}

logNodeValue(exampleNode)
