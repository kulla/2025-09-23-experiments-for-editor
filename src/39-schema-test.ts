type Factory<I, O> = (arg: I) => O

interface Schema<F = unknown> {
  isJsonValue(value: unknown): value is F
}

type JSONValue<S extends Schema> = S extends Schema<infer U> ? U : never

const booleanSchema = ((): Schema<boolean> => ({
  isJsonValue(value: unknown) {
    return typeof value === 'boolean'
  },
})) satisfies Factory<never, Schema<boolean>>

const numberSchema = ((): Schema<number> => ({
  isJsonValue(value: unknown) {
    return typeof value === 'number'
  },
})) satisfies Factory<never, Schema<number>>

const stringSchema = ((): Schema<string> => ({
  isJsonValue(value: unknown) {
    return typeof value === 'string'
  },
})) satisfies Factory<never, Schema<string>>

const unionSchema = <F extends Schema[]>(
  ...schemas: F
): Schema<JSONValue<F[number]>> => ({
  isJsonValue(value: unknown): value is JSONValue<F[number]> {
    return schemas.some((schema) => schema.isJsonValue(value))
  },
})

export const BooleanSchema = booleanSchema()
export const NumberSchema = numberSchema()
export const StringSchema = stringSchema()
export const BooleanOrNumberSchema = unionSchema(
  BooleanSchema,
  NumberSchema,
  StringSchema,
)
