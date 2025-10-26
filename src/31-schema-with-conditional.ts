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

function logNodeValue(node: NestedNode) {
  if (node.spec.type === 'string') {
    console.log('String value:', node.value)
  } else if (node.spec.type === 'array') {
    console.log('Array values:')
    for (const item of node.value) {
      logNodeValue(item)
    }
  }
}
