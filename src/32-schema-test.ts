interface SchemaBase {
  name: string
}

interface StringSchema extends SchemaBase {
  type: 'string'
}

interface BooleanSchema extends SchemaBase {
  type: 'boolean'
}

interface ObjectSchema<P extends string = string> extends SchemaBase {
  type: 'object'
  record: Record<P, Schema>
  properties: [P, Schema][]
}

// TODO: name do not need to be specified, will be automatically be computed

const S = {
  string(name: string): StringSchema {
    return { type: 'string', name }
  },
  boolean(name: string): BooleanSchema {
    return { type: 'boolean', name }
  },
  object<N extends string, P extends [string, Schema][]>(
    name: N,
    ...properties: P
  ) {
    const record = Object.fromEntries(properties) as {
      [K in P[number] as K[0]]: K[1]
    }

    return { type: 'object', name, record, properties } satisfies ObjectSchema
  },
  property<N extends string, S extends Schema>(name: N, value: S): [N, S] {
    return [name, value]
  },
} as const

type Schema = StringSchema | BooleanSchema | ObjectSchema

const stringType = S.string('string')
const booleanType = S.boolean('boolean')
const MultipleChoiceAnswerType = S.object(
  'multipleChoice.answer',
  S.property('isCorrect', booleanType),
  S.property('text', stringType),
) satisfies Schema

type JSONValue<S extends Schema> = S extends StringSchema
  ? string
  : S extends BooleanSchema
    ? boolean
    : S extends ObjectSchema
      ? { [K in S['properties'][number] as K[0]]: JSONValue<K[1]> }
      : never

export type TestJsonValue1 = JSONValue<typeof MultipleChoiceAnswerType>

interface JsonNode<S extends Schema> {
  spec: S
  value: JSONValue<S>
}

function isJsonKind<S extends Schema, T extends S['type']>(
  node: JsonNode<S>,
  type: T,
): node is JsonNode<Extract<S, { type: T }>> {
  return node.spec.type === type
}

type Branded<T, B> = T & { __brand: B }
type Key = Branded<string, 'key'>

type FlatValue<S extends Schema = Schema> = S extends StringSchema
  ? string
  : S extends BooleanSchema
    ? boolean
    : S extends ObjectSchema
      ? (readonly [string, Key])[]
      : never

interface FlatNode<S extends Schema = Schema> {
  spec: S
  key: Key
  parentKey: Key | null
  value: FlatValue<S>
}

function isFlatKind<S extends Schema, T extends S['type']>(
  node: FlatNode<S>,
  type: T,
): node is FlatNode<Extract<S, { type: T }>> {
  return node.spec.type === type
}

class FlatStorage {
  private map = new Map<Key, FlatNode>()
  private keyGenerator = new PrefixCounter('k')

  get(id: Key) {
    const value = this.map.get(id)

    if (!value) throw new Error(`Key not found: ${id}`)

    return value
  }

  insert(
    spec: Schema,
    parentKey: Key | null,
    createValue: (key: Key) => FlatValue,
  ): Key {
    const key = this.keyGenerator.next()
    const value = createValue(key)
    this.map.set(key, { key, parentKey, value, spec })
    return key
  }
}

class PrefixCounter {
  private n = 0
  constructor(private prefix = 'n') {}
  next() {
    this.n += 1
    return `${this.prefix}${this.n}` as Key
  }
}

function jsonGetProperty<
  O extends ObjectSchema,
  P extends keyof O['record'] & keyof JsonNode<O>,
>(node: JsonNode<O>, propertyName: P): JsonNode<O['record'][P]> {
  const propSchema = node.spec.record[propertyName]
  const propValue = node.value[propertyName]
  return { spec: propSchema, value: propValue }
}

function store(
  storage: FlatStorage,
  node: JsonNode<Schema>,
  parentKey: Key | null = null,
): Key {
  if (isJsonKind(node, 'object')) {
    return storage.insert(node.spec, parentKey, (key) => {
      return node.spec.properties.map(([propName]) => {
        const propKey = store(storage, jsonGetProperty(node, propName), key)
        return [propName, propKey] as const
      })
    })
  } else if (isJsonKind(node, 'string') || isJsonKind(node, 'boolean')) {
    return storage.insert(node.spec, parentKey, () => node.value)
  } else {
    throw new Error(`Unsupported schema type: ${node.spec.type}`)
  }
}

const rootNode: JsonNode<typeof MultipleChoiceAnswerType> = {
  spec: MultipleChoiceAnswerType,
  value: { isCorrect: true, text: 'Choice A' },
}

const isCorrectNode = jsonGetProperty(rootNode, 'isCorrect')
console.log('isCorrect node:', isCorrectNode)

const storage = new FlatStorage()
const rootKey = store(storage, rootNode)

console.log('Root key:', rootKey)
console.log('Root node:', storage.get(rootKey))

function retrieve(storage: FlatStorage, key: Key): JsonNode<Schema> {
  const flatNode = storage.get(key)

  if (isFlatKind(flatNode, 'object')) {
    const objValue: Record<string, JSONValue<Schema>> = {}
    for (const [propName, propKey] of flatNode.value) {
      const propNode = retrieve(storage, propKey)
      objValue[propName] = propNode.value
    }
    return { spec: flatNode.spec, value: objValue }
  } else if (
    isFlatKind(flatNode, 'string') ||
    isFlatKind(flatNode, 'boolean')
  ) {
    return { spec: flatNode.spec, value: flatNode.value as JSONValue<Schema> }
  } else {
    throw new Error(`Unsupported schema type: ${flatNode.spec.type}`)
  }
}

const retrievedNode = retrieve(storage, rootKey)
console.log('Retrieved node:', retrievedNode)
