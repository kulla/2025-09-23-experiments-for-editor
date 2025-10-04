import { invariant } from 'es-toolkit'

type NonRootKey = `${number}`
type RootKey = 'root'
type Key = RootKey | NonRootKey

interface Transaction {
  attachRoot(key: RootKey, value: FlatValue): void
  insert(
    type: string,
    parentKey: Key,
    createValue: (key: NonRootKey) => FlatValue,
  ): NonRootKey
}

interface Writable {
  tx: Transaction
}

interface EditorStore {
  getValue<F extends FlatValue>(
    guard: (value: FlatValue) => value is F,
    key: Key,
  ): F
  getParentKey(key: Key): Key | null
  getTypeName(key: Key): string
}

type PrimitiveValue = string | number | boolean

type FlatValue = Record<string, Key> | Key[] | Key | PrimitiveValue
type TreeValue =
  | Record<string, TreeNode>
  | TreeNode[]
  | TreeNode
  | PrimitiveValue

interface FlatNode<S extends NodeSpec = NodeSpec> {
  store: EditorStore
  value: S['Key']
}

interface TreeNode<S extends NodeSpec = NodeSpec> {
  typeName: string
  value: S['TreeValue']
}

interface WithType<S extends NodeSpec> {
  type: NodeType<S>
}

interface NodeSpec {
  TypeName: string
  Key: Key
  ParentKey: Key | null
  FlatValue: FlatValue
  TreeValue: TreeValue
  JSONValue: unknown
}

interface NodeType<S extends NodeSpec = NodeSpec> {
  spec: S
  name: string
  isParentKey(key: Key | null): key is S['ParentKey']
  isFlatValue(value: unknown): value is S['FlatValue']
  isTreeValue(value: unknown): value is S['TreeValue']
  isJSONValue(value: unknown): value is S['JSONValue']
  toTreeNode(value: S['JSONValue']): TreeNode<S>
  toJSON(value: S['TreeValue']): S['JSONValue']
  store(node: TreeNode<S> & Writable, parentKey: S['ParentKey']): void
  restore(node: FlatNode<S>): TreeNode<S>
}

export function getFlatValue<S extends NodeSpec>(
  node: FlatNode<S> & { type?: NodeType<S> },
): S['FlatValue'] {
  const { store, value: key, type = getType(node) } = node

  return store.getValue(type.isFlatValue, key)
}

export function getParentKey<S extends NodeSpec>(
  node: FlatNode<S> & { type?: NodeType<S> },
): S['ParentKey'] {
  const { store, value: key, type = getType(node) } = node
  const parentKey = store.getParentKey(key)

  invariant(
    type.isParentKey(parentKey),
    `Invalid parent key for node type ${type.name}`,
  )

  return parentKey
}

function getTypeName(node: FlatNode | TreeNode): string {
  return 'typeName' in node ? node.typeName : node.store.getTypeName(node.value)
}

const nodeTypes = new Map<string, NodeType>()

function getType<S extends NodeSpec>(
  node: FlatNode<S> | TreeNode<S>,
): NodeType<S> {
  const typeName = getTypeName(node)
  const type = nodeTypes.get(typeName)

  invariant(type, `Unknown node type: ${typeName}`)

  return type as NodeType<S>
}

export function loadType<S extends NodeSpec>(
  node: FlatNode<S>,
): FlatNode<S> & WithType<S>
export function loadType<S extends NodeSpec>(
  node: TreeNode<S>,
): TreeNode<S> & WithType<S>
export function loadType<S extends NodeSpec>(
  node: FlatNode<S> | TreeNode<S>,
): (FlatNode<S> & WithType<S>) | (TreeNode<S> & WithType<S>) {
  const type = getType(node)
  return { ...node, type }
}

export function getChild<
  S extends NodeSpec & { FlatValue: Key; TreeValue: TreeNode },
>(node: FlatNode<S>): FlatNode
export function getChild<
  S extends NodeSpec & { FlatValue: Key; TreeValue: TreeNode },
>(node: TreeNode<S>): TreeNode
export function getChild<
  S extends NodeSpec & { FlatValue: Key; TreeValue: TreeNode },
>(node: FlatNode<S> | TreeNode<S>): FlatNode | TreeNode {
  // @ts-expect-error TODO
  const childValue = getValue(node)
  const { value: _value, ...rest } = node
  return { ...rest, value: childValue }
}

function getValue<S extends NodeSpec>(node: FlatNode<S>): S['FlatValue']
function getValue<S extends NodeSpec>(node: TreeNode<S>): S['TreeValue']
function getValue<S extends NodeSpec>(
  node: FlatNode<S> | TreeNode<S>,
): S['FlatValue'] | S['TreeValue'] {
  if ('store' in node) {
    return getFlatValue(node)
  } else {
    return node.value
  }
}
