import { invariant } from 'es-toolkit'

type Primitive = string | number | boolean
type Value<T> = Record<string, T> | T[] | T | Primitive

type NonRootKey = `${number}`
type RootKey = `root`
type Key = NonRootKey | RootKey
type FlatValue = Value<Key>

interface EditorStore {
  get<F extends FlatValue>(guard: (value: FlatValue) => value is F, key: Key): F
  save(value: FlatValue): Key
  getEntries(): [Key, FlatValue][]
}

function createEditorStore(): EditorStore {
  const store = new Map<Key, FlatValue>()
  let lastKey = 0

  return {
    get(guard, key) {
      const value = store.get(key)

      invariant(value !== undefined, `No value found for key: ${key}`)
      invariant(guard(value), `Value for key: ${key} does not match guard`)

      return value
    },
    save(value) {
      const key = (lastKey++).toString() as NonRootKey
      store.set(key, value)
      return key
    },
    getEntries() {
      return Array.from(store.entries())
    },
  }
}

interface NodeSpec {
  TreeValue: Value<TreeNode>
  FlatValue: Value<Key>
  JSONValue: unknown
}

interface TreeNode<S extends NodeSpec = NodeSpec> {
  value: S['TreeValue']
}

interface FlatNode {
  key: Key
}

interface Iso<S, A> {
  to: (s: S) => A
  from: (a: A) => S
}

interface NodeType<S extends NodeSpec> {
  readonly jsonToTree: Iso<S['JSONValue'], TreeNode<S>>
  readonly treeToFlat: (store: EditorStore) => Iso<TreeNode<S>, FlatNode>
}

function isString(value: unknown): value is string {
  return typeof value === 'string'
}

const TextType: NodeType<{
  TreeValue: string
  FlatValue: string
  JSONValue: string
}> = {
  jsonToTree: {
    to: (json) => ({ value: json }),
    from: (tree) => tree.value,
  },
  treeToFlat: (store) => ({
    to: (tree) => ({ key: store.save(tree.value) }),
    from: (flat) => ({ value: store.get(isString, flat.key) }),
  }),
}

function isKey(value: unknown): value is Key {
  return (
    typeof value === 'string' &&
    (value === 'root' || !Number.isNaN(Number(value)))
  )
}

function WrappedNodeType<T extends string, S extends NodeSpec>(
  typeName: T,
  childType: NodeType<S>,
): NodeType<{
  TreeValue: TreeNode<S>
  FlatValue: Key
  JSONValue: { type: T; value: S['JSONValue'] }
}> {
  return {
    jsonToTree: {
      to: (json) => ({ value: childType.jsonToTree.to(json.value) }),
      from: (tree) => ({
        type: typeName,
        value: childType.jsonToTree.from(tree.value),
      }),
    },
    treeToFlat: (store) => ({
      to: (tree) => childType.treeToFlat(store).to(tree.value),
      from: (flat) => ({ value: childType.treeToFlat(store).from(flat) }),
    }),
  }
}

const ParagraphType = WrappedNodeType('paragraph', TextType)

function ArrayNodeType<C extends NodeSpec>(
  childType: NodeType<C>,
): NodeType<{
  TreeValue: TreeNode<C>[]
  FlatValue: Key[]
  JSONValue: C['JSONValue'][]
}> {
  return {
    jsonToTree: {
      to: (json) => ({ value: json.map(childType.jsonToTree.to) }),
      from: (tree) => tree.value.map(childType.jsonToTree.from),
    },
    treeToFlat: (store) => ({
      to: (tree) => ({
        key: store.save(
          tree.value.map((t) => childType.treeToFlat(store).to(t).key),
        ),
      }),
      from: (flat) => {
        const keys = store.get(
          (v): v is Key[] => Array.isArray(v) && v.every(isKey),
          flat.key,
        )
        return {
          value: keys.map((key) => childType.treeToFlat(store).from({ key })),
        }
      },
    }),
  }
}

const DocumentType = ArrayNodeType(ParagraphType)

const exampleJson = [
  { type: 'paragraph' as const, value: 'Hello' },
  { type: 'paragraph' as const, value: 'World' },
]

const exampleTree = DocumentType.jsonToTree.to(exampleJson)

console.log('Example Tree:', JSON.stringify(exampleTree, undefined, 2))

const store = createEditorStore()

const exampleFlat = DocumentType.treeToFlat(store).to(exampleTree)

console.log('Example Flat:', exampleFlat)
console.log('Store Entries:', store.getEntries())
