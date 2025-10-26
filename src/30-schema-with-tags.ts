interface BaseNodeSpec {
  isRoot: boolean
  name: string
}

interface BooleanNodeSpec extends BaseNodeSpec {
  type: 'boolean'
}

interface ArrayNodeSpec extends BaseNodeSpec {
  type: 'array'
  items: NodeSpec
}

type NodeSpec = BooleanNodeSpec | ArrayNodeSpec

interface BooleanNestedNode {
  type: 'boolean'
  spec: BooleanNodeSpec
  value: boolean
}

interface ArrayNestedNode {
  type: 'array'
  spec: ArrayNodeSpec
  value: NestedNode[]
}

type NestedNode = BooleanNestedNode | ArrayNestedNode

const booleanNodeSpec: BooleanNodeSpec = {
  type: 'boolean',
  name: 'boolean',
  isRoot: false,
}

const arrayNodeSpec: ArrayNodeSpec = {
  type: 'array',
  name: 'array',
  isRoot: true,
  items: booleanNodeSpec,
}

const exampleNestedNode: NestedNode = {
  type: 'array',
  spec: arrayNodeSpec,
  value: [
    { spec: booleanNodeSpec, value: true, type: 'boolean' },
    { spec: booleanNodeSpec, value: false, type: 'boolean' },
  ],
}

if (exampleNestedNode.spec.type === 'array') {
  exampleNestedNode.value.forEach((item) => {
    if (item.spec.type === 'boolean') {
      console.log(`Boolean value: ${item.value}`)
    }
  })
}

function logNestedNode(node: NestedNode): void {
  if (node.type === 'boolean') {
    console.log(`Boolean Node - Value: ${node.value}`)
  } else if (node.type === 'array') {
    console.log(`Array Node - Items:`)
    node.value.forEach((item) => {
      logNestedNode(item)
    })
  }
}

logNestedNode(exampleNestedNode)
