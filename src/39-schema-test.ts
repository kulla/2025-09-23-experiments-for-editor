type Factory<I extends Schema[], O> = (arg: I) => O

type Output<F> = F extends Factory<infer _I, infer O> ? O : never

interface Schema<F = unknown> {
  isJsonValue(value: unknown): value is F
}

type JSONValue<S extends Schema> = S extends Schema<infer U> ? U : never

const booleanSchema = withGuard(
  (): Schema<boolean> => ({
    isJsonValue(value: unknown) {
      return typeof value === 'boolean'
    },
  }),
)

const numberSchema = withGuard(
  (): Schema<number> => ({
    isJsonValue(value: unknown) {
      return typeof value === 'number'
    },
  }),
)

const stringSchema = withGuard(
  (): Schema<string> => ({
    isJsonValue(value: unknown) {
      return typeof value === 'string'
    },
  }),
)

const unionSchema = withGuard(
  <F extends Schema[]>(schemas: F): Schema<JSONValue<F[number]>> => ({
    isJsonValue(value: unknown): value is JSONValue<F[number]> {
      return schemas.some((schema) => schema.isJsonValue(value))
    },
  }),
)

export const BooleanSchema = booleanSchema.create()
export const NumberSchema = numberSchema.create()
export const StringSchema = stringSchema.create()
export const BooleanOrNumberSchema = unionSchema.create([
  BooleanSchema,
  NumberSchema,
  StringSchema,
])

function withGuard<F extends Factory<Schema[], object>>(
  factory: F,
): { create: F; is: (value: unknown) => value is Output<F> } {
  const typeSymbol = Symbol()

  return {
    create: ((arg) => ({
      [typeSymbol]: true,
      ...factory(arg),
    })) as F,
    is(value: unknown): value is Output<F> {
      return typeof value === 'object' && value !== null && typeSymbol in value
    },
  }
}
