interface StringSchema {
  kind: 'string'
}

interface ArraySchema<E extends Schema = Schema> {
  kind: 'array'
  element: E
}

type Schema = StringSchema | ArraySchema

const S = {
  string: { kind: 'string' } as StringSchema,
  array<E extends Schema>(element: E): ArraySchema<E> {
    return { kind: 'array', element }
  },
}

const exampleSchema = S.array(S.array(S.string))

type _JSONValue<S> = S extends StringSchema
  ? string
  : S extends ArraySchema<infer E>
    ? ReadonlyArray<_JSONValue<E>>
    : never

type JSONValue<S> = [S] extends [unknown] ? _JSONValue<S> : never

interface NestedNode<S extends Schema> {
  schema: S
  value: JSONValue<S>
}

export type ExampleValue = JSONValue<typeof exampleSchema>

const exampleNode: NestedNode<typeof exampleSchema> = {
  schema: exampleSchema,
  value: [['a', 'b'], ['c']],
}

function getFirstElement<E extends Schema>(
  node: NestedNode<ArraySchema<E>>,
): NestedNode<E> {
  const value = node.value[0]

  if (value === undefined) {
    throw new Error('Array is empty')
  }

  return { schema: node.schema.element, value }
}

console.log(getFirstElement(exampleNode))
