/**
 * Flat Node Architecture — single-file attempt
 * ------------------------------------------------------------
 * Goals supported by this example:
 * - Node type specifications (schema/spec) live in a registry
 * - Each node is stored flat (no Yjs) in a key-value storage by id
 * - Behaviors are external standalone functions that switch on NodeKind
 * - Schemas support: array, object-as-ordered-tuple, singleton/wrapper, value
 * - Root vs non-root distinction in the spec
 * - Example at bottom shows how to store & retrieve
 */

// ---------- Core Types ----------
type NodeId = string

type Value<V> = [name: string, value: V][] | V[] | V | string | number | boolean
type FlatValue = Value<NodeId>

// Node specification variants
interface ArrayNodeSpec extends BasicNodeSpec {
  kind: 'array'
  itemSpec: NodeSpec
}

interface ObjectNodeSpec extends BasicNodeSpec {
  kind: 'object'
  fields: [name: string, type: NodeSpec][]
}

interface SingletonNodeSpec extends BasicNodeSpec {
  kind: 'singleton'
  childType: NodeSpec
}

interface PrimitiveNodeSpec extends BasicNodeSpec {
  kind: 'primitive'
}

interface BasicNodeSpec {
  name: string
  isRoot: boolean
}

type NodeSpec =
  | ArrayNodeSpec
  | ObjectNodeSpec
  | SingletonNodeSpec
  | PrimitiveNodeSpec

/** Spec registry */
type SpecRegistry = Record<string, NodeSpec>

// Flat node variants
interface FlatNode<S extends NodeSpec = NodeSpec> {
  id: NodeId
  type: string
  value: S['FlatValue'] & object
}

/** Plain key-value storage */
interface FlatStorage {
  get(id: NodeId): FlatNode | undefined
  set(node: FlatNode): void
}

/** In-memory implementation */
class MemStorage implements FlatStorage {
  private map = new Map<NodeId, FlatNode>()
  get(id: string) {
    return this.map.get(id)
  }
  set(node: FlatNode) {
    this.map.set(node.id, node)
  }
}

// ---------- Nested (rich) shape used at API edges ----------
// The nested form is convenient for authoring; the storage stays flat.

type NestedNode =
  | { type: string; kind: 'array'; items: NestedNode[] }
  | { type: string; kind: 'object'; fields: Record<string, NestedNode> }
  | { type: string; kind: 'singleton'; child: NestedNode }
  | { type: string; kind: 'value'; value: unknown }

// ---------- Utilities ----------

interface IdGenerator {
  next(): NodeId
}
class PrefixCounter implements IdGenerator {
  private n = 0
  constructor(private prefix = 'n') {}
  next() {
    this.n += 1
    return `${this.prefix}${this.n}`
  }
}

function assert(condition: unknown, msg: string): asserts condition {
  if (!condition) throw new Error(msg)
}

function getSpec(reg: SpecRegistry, type: string): NodeSpec {
  const spec = reg[type]
  assert(!!spec, `Unknown type: ${type}`)
  return spec
}

// ---------- External Behavior Functions (switching on kind) ----------

/** Convert nested node -> flat nodes; return root id */
function storeNested(
  node: NestedNode,
  storage: FlatStorage,
  reg: SpecRegistry,
  ids: IdGenerator = new PrefixCounter('id_'),
): NodeId {
  const spec = getSpec(reg, node.type)
  const id = ids.next()

  switch (spec.kind) {
    case 'array': {
      const childIds = node.items.map((it) =>
        storeNested(it, storage, reg, ids),
      )
      storage.set({ id, type: spec.name, kind: 'array', items: childIds })
      return id
    }
    case 'object': {
      const entries: [string, NodeId][] = []
      assert(spec.fields && spec.fields.length > 0, `${spec.name} needs fields`)
      for (const f of spec.fields) {
        const child = node.fields[f.key]
        if (!child) continue // optional
        const cid = storeNested(child, storage, reg, ids)
        entries.push([f.key, cid])
      }
      storage.set({ id, type: spec.name, kind: 'object', entries })
      return id
    }
    case 'singleton': {
      const cid = storeNested(node.child, storage, reg, ids)
      storage.set({ id, type: spec.name, kind: 'singleton', child: cid })
      return id
    }
    case 'value': {
      storage.set({ id, type: spec.name, kind: 'primitive', value: node.value })
      return id
    }
  }
}

/** Reconstruct nested node from a flat id */
function loadNested(
  id: NodeId,
  storage: FlatStorage,
  reg: SpecRegistry,
): NestedNode {
  const base = storage.get(id)
  assert(!!base, `Missing node id=${id}`)
  const spec = getSpec(reg, base!.type)

  switch (base!.kind) {
    case 'array': {
      const items = base!.items.map((cid) => loadNested(cid, storage, reg))
      return { type: spec.name, kind: 'array', items }
    }
    case 'object': {
      const fields: Record<string, NestedNode> = {}
      for (const [k, cid] of base!.entries) {
        fields[k] = loadNested(cid, storage, reg)
      }
      return { type: spec.name, kind: 'object', fields }
    }
    case 'singleton': {
      const child = loadNested(base!.child, storage, reg)
      return { type: spec.name, kind: 'singleton', child }
    }
    case 'value': {
      return { type: spec.name, kind: 'primitive', value: (base as any).value }
    }
  }
}

/** Iterate child ids in storage order (helps generic algorithms) */
function childIdsOf(node: FlatNode): NodeId[] {
  switch (node.kind) {
    case 'array':
      return node.items.slice()
    case 'object':
      return node.entries.map(([_, id]) => id)
    case 'singleton':
      return [node.child]
    case 'value':
      return []
  }
}

/** Generic traversal over flat storage, pre-order */
function traverse(
  rootId: NodeId,
  storage: FlatStorage,
  visit: (n: FlatNode) => void,
): void {
  const stack: NodeId[] = [rootId]
  while (stack.length) {
    const id = stack.pop()!
    const n = storage.get(id)
    if (!n) throw new Error(`Dangling id ${id}`)
    visit(n)
    const kids = childIdsOf(n)
    for (let i = kids.length - 1; i >= 0; i--) stack.push(kids[i])
  }
}

// ---------- Example Spec Registry ----------

/**
 * Types covered:
 * - Text: value node (string)
 * - Emphasis: singleton wrapper around inline
 * - Paragraph: array of inlines
 * - Body: array of paragraphs
 * - Article: object-as-ordered-tuple with title + body, and marked as root
 */
const REGISTRY: SpecRegistry = {
  Text: { name: 'Text', kind: 'primitive' },
  Emphasis: { name: 'Emphasis', kind: 'singleton', childType: 'Text' }, // singleton wrapping Text for brevity
  Paragraph: { name: 'Paragraph', kind: 'array', itemSpec: 'Text' },
  Body: { name: 'Body', kind: 'array', itemSpec: 'Paragraph' },
  Article: {
    name: 'Article',
    kind: 'object',
    isRoot: true,
    fields: [
      { key: 'title', type: 'Text' },
      { key: 'body', type: 'Body' },
    ],
  },
}

// ---------- Example Usage (self-contained demo) ----------

function example() {
  const storage = new MemStorage()
  const ids = new PrefixCounter('ex')

  const nested: NestedNode = {
    type: 'Article',
    kind: 'object',
    fields: {
      title: { type: 'Text', kind: 'primitive', value: 'Hello Flat World' },
      body: {
        type: 'Body',
        kind: 'array',
        items: [
          {
            type: 'Paragraph',
            kind: 'array',
            items: [
              { type: 'Text', kind: 'primitive', value: 'This is ' },
              { type: 'Text', kind: 'primitive', value: 'fine.' },
            ],
          },
        ],
      },
    },
  }

  // Store into flat storage
  const rootId = storeNested(nested, storage, REGISTRY, ids)

  // Traverse
  const seen: string[] = []
  traverse(rootId, storage, (n) => {
    seen.push(`${n.id}:${n.type}`)
  })

  // Load back to nested form
  const back = loadNested(rootId, storage, REGISTRY)

  return { rootId, seen, back }
}

// Run the example if this file is executed directly (ts-node style)
if (typeof require !== 'undefined' && require.main === module) {
  const { rootId, seen, back } = example()
  // eslint-disable-next-line no-console
  console.log('rootId=', rootId)
  // eslint-disable-next-line no-console
  console.log('preorder=', seen.join(' -> '))
  // eslint-disable-next-line no-console
  console.log('reconstructed=', JSON.stringify(back, null, 2))
}

// ---------- Extension points you can add in separate files ----------
// - prettyPrint(nodeId, storage, reg)
// - diff(aId, bId, storage)
// - patch(rootId, op, storage)
// All of these can switch on storage.get(id).kind via the FlatNode union.
