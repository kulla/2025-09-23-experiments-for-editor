interface HKT<A extends SchemaDef> {
  Schema: Schema<A>
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

type Factory<I extends SchemaDef, F extends keyof HKT<I>> = {
  create(input: I): HKT<I>[F]
}

const schemaFactory = <D extends SchemaDef>(): Factory<D, 'Schema'> => ({
  create: ({ kind, ...parameters }) => {
    return {
      kind,
      ...parameters,
      isFlat: (_value): _value is D['FlatValue'] => {
        // Implement your flat value check logic here
        // For demonstration, we'll just return false
        return false
      },
    } satisfies Schema<D>
  },
})
