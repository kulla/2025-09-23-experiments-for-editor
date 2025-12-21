interface HKT<A> {
  Schema: { Input:  A extends SchemaDef ? SchemaInput<A> : never
           Output:
    A extends SchemaDef ? Schema<A> : never }
}

interface SchemaDef {
  kind: string
  FlatValue: unknown
  // biome-ignore lint: Is okay
  Parameters: {}
}

type SchemaInput<D extends SchemaDef> = D['Parameters'] & {
  kind: D['kind']
}

type Schema<D extends SchemaDef> = D['Parameters'] & {
  isFlat: (value: unknown) => value is D['FlatValue']
  kind: D['kind']
}

type Factory<D, F extends keyof HKT<D>> = {
  create(input: HKT<D>[F]["Input"]): HKT<D>[F]["Output"]
}

export type ExampleSchemaFactory = Factory<{ kind: "string", FlatValue: string, Parameters: { maxLength?: number }}, "Schema">

const schemaFactory = <D extends SchemaDef>():  => ({
  create: ({ kind, ...parameters }) => {
    return {
      kind,
      ...parameters,
      isFlat: (_value): _value is D['FlatValue'] => {
        // Implement your flat value check logic here
        // For demonstration, we'll just return false
        return false
      },
    }
  },
})

const string = schemaFactory<{
  kind: 'string'
  FlatValue: string
  Parameters: { maxLength?: number; minLength?: number }
}>()

export const MyStringSchema = string.create({ kind: 'string', maxLength: 255 })

const boolean = schemaFactory<{
  kind: 'boolean'
  FlatValue: boolean
  // biome-ignore lint: Is okay
  Parameters: {}
}>()

export const MyBooleanSchema = boolean.create({ kind: 'boolean' })
