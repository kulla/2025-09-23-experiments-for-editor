type Factory<I, O> = (arg: I) => O

type Output<F> = F extends Factory<infer _I, infer O> ? O : never

interface Schema<F = unknown> {
  isJsonValue(value: unknown): value is F
}

type JSONValue<S extends Schema> = S extends Schema<infer U> ? U : never

const boolean = createSchemaFactory(
  (): Schema<boolean> => ({
    isJsonValue(value: unknown) {
      return typeof value === 'boolean'
    },
  }),
)

const number = createSchemaFactory(
  (): Schema<number> => ({
    isJsonValue(value: unknown) {
      return typeof value === 'number'
    },
  }),
)

const string = createSchemaFactory(
  (): Schema<string> => ({
    isJsonValue(value: unknown) {
      return typeof value === 'string'
    },
  }),
)

const union = createSchemaFactory(
  <F extends Schema[]>(schemas: F): Schema<JSONValue<F[number]>> => ({
    isJsonValue(value: unknown): value is JSONValue<F[number]> {
      return schemas.some((schema) => schema.isJsonValue(value))
    },
  }),
)

export const BooleanSchema = boolean.create()
export const NumberSchema = number.create()
export const StringSchema = string.create()
export const BooleanOrNumberSchema = union.create([
  BooleanSchema,
  NumberSchema,
  StringSchema,
])

function createSchemaFactory<F extends Factory<Schema[], object>>(
  factory: F,
): { create: F; is: (value: unknown) => value is Output<F> } {
  const typeSymbol = Symbol()

  return {
    create(arg) {
      return { [typeSymbol]: true, ...factory(arg) }
    },
    is(value: unknown): value is Output<F> {
      return typeof value === 'object' && value !== null && typeSymbol in value
    },
  }
}
