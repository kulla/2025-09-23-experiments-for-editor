type AnyFunction = (...args: unknown[]) => unknown
type Implementation<C extends AnyFunction = AnyFunction> = [C, C]

interface SchemaBase {
  kind: string
  data: unknown
  capabilities: Implementation[]
}

type DataOf<S extends SchemaBase> = S['data']

interface ArraySchema<C extends SchemaBase = SchemaBase> extends SchemaBase {
  kind: 'array'
  data: DataOf<C>[]
  child: C
}

interface StringSchema extends SchemaBase {
  kind: 'string'
  data: string
}

type Schema = ArraySchema | StringSchema

function isArraySchema<S extends SchemaBase>(arg: S): arg is ArraySchema {
  return arg.kind === 'array'
}

function isStringSchema<S extends SchemaBase>(arg: S): arg is StringSchema {
  return arg.kind === 'string'
}
