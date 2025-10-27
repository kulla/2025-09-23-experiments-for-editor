// ---------- Schemas ----------
interface StringSchema {
  kind: 'string'
}

interface ArraySchema<E extends Schema = Schema> {
  kind: 'array'
  element: E
}

interface ObjectSchema<
  Props extends Record<string, Schema> = Record<string, Schema>,
> {
  kind: 'object'
  props: Props
}

type Schema = StringSchema | ArraySchema | ObjectSchema

// ---------- JSONValue (non-distributive wrapper to avoid union explosion) ----------
type _JSONValue<S> = S extends StringSchema
  ? string
  : S extends ArraySchema<infer E>
    ? ReadonlyArray<_JSONValue<E>>
    : S extends ObjectSchema<infer P>
      ? { readonly [K in keyof P]: _JSONValue<P[K]> }
      : never

type JSONValue<S> = [S] extends [unknown] ? _JSONValue<S> : never

// ---------- Schema builders ----------
const S = {
  string(): StringSchema {
    return { kind: 'string' }
  },
  array<E extends Schema>(element: E): ArraySchema<E> {
    return { kind: 'array', element }
  },
  object<P extends Record<string, Schema>>(props: P): ObjectSchema<P> {
    return { kind: 'object', props }
  },
} as const

// ---------- Branded correlation (nominal pair) ----------

type NestedNode<S extends Schema> = {
  readonly schema: S
  readonly value: JSONValue<S>
}

function nestedNode<S extends Schema>(
  schema: S,
  value: JSONValue<S>,
): NestedNode<S> {
  return { schema, value }
}

// ---------- mapArray: map elements of an ArraySchema (can change element schema) ----------
function mapArray<E extends Schema, O>(
  p: NestedNode<ArraySchema<E>>,
  f: (el: NestedNode<E>, index: number) => O,
): O[] {
  return p.value.map((e, index) => f(nestedNode(p.schema.element, e), index))
}

// ---------- mapProp: map a single property of an ObjectSchema (can change that property's schema) ----------
function mapProp<P extends Record<string, Schema>, K extends keyof P, O>(
  p: NestedNode<ObjectSchema<P>>,
  key: K,
  f: (prop: NestedNode<P[K]>) => O,
): O {
  return f(nestedNode(p.schema.props[key], p.value[key]))
}

// ---------- Demo ----------

// Schema: { title: string; tags: string[] }
const string = S.string()
const schema = S.object({
  title: string,
  tags: S.array(string),
})

// Paired value
const node = nestedNode(schema, {
  title: 'hello world',
  tags: ['a', 'b', 'c'] as const,
})

// 1) mapArray: uppercase all tags (element schema unchanged)
const tagsUpper = mapArray(
  nestedNode(schema.props.tags, node.value.tags),
  ({ value }) => value.toUpperCase(),
)

console.log(tagsUpper) // ['A', 'B', 'C']
// tagsUpper: Paired<ArraySchema<StringSchema>>

// 2) mapProp: update the 'title' property (schema unchanged)
const node2 = mapProp(node, 'title', ({ value }) => value.toUpperCase())

console.log(node2)

// 3) mapProp + mapArray: update the 'tags' property by reusing mapArray
const node3 = mapProp(node, 'tags', (prop) =>
  mapArray(prop, ({ value }) => value + value),
)

console.log(node3)

// ----------------------
// Notes:
// - The brands ensure you can’t accidentally pair a value with a mismatched schema.
// - mapArray allows changing the element schema (E -> E2) by providing `outElemSchema`.
// - mapProp allows changing just one property's schema while preserving the rest.
