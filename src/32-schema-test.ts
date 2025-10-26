interface SchemaBase {
  name: string
}

interface StringSchema extends SchemaBase {
  type: 'string'
}

interface BooleanSchema extends SchemaBase {
  type: 'boolean'
}

interface ObjectSchema extends SchemaBase {
  type: 'object'
  properties: Property[]
}

type Property<Name extends string = string, Value extends Schema = Schema> = [
  name: Name,
  value: Value,
]

// TODO: name do not need to be specified, will be automatically be computed

const S = {
  string(name: string): StringSchema {
    return { type: 'string', name }
  },
  boolean(name: string): BooleanSchema {
    return { type: 'boolean', name }
  },
  object<N extends string, P extends Property[]>(name: N, ...properties: P) {
    return { type: 'object', name, properties } satisfies ObjectSchema
  },
  property<N extends string, S extends Schema>(
    name: N,
    value: S,
  ): Property<N, S> {
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

export type TestJsonValue1 = JSONValue<typeof MultipleChoiceAnswerType>

type JSONValue<S extends Schema> = S extends StringSchema
  ? string
  : S extends BooleanSchema
    ? boolean
    : S extends ObjectSchema
      ? { [K in S['properties'][number] as K[0]]: JSONValue<K[1]> }
      : never
