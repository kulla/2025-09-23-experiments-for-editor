type TypeInformation = typeof TypeInformation
declare const TypeInformation: unique symbol

interface BaseSchema {
  [TypeInformation]?: {
    FlatValue: unknown
    JSONValue: unknown
  }
}

type FlatValue<T extends BaseSchema> = NonNullable<
  T[TypeInformation]
>['FlatValue']
type JSONValue<T extends BaseSchema> = NonNullable<
  T[TypeInformation]
>['JSONValue']

interface StringSchema extends BaseSchema {
  kind: 'string'
  [TypeInformation]?: {
    FlatValue: string
    JSONValue: string
  }
}

const string = (): StringSchema => ({
  kind: 'string',
})

const Text = string()

export type TextFlat = FlatValue<typeof Text>
export type TextJSON = JSONValue<typeof Text>

interface Iso<A, B> {
  to: (a: A) => B
  from: (b: B) => A
}

type Brand<K, T> = K & { __brand: T }
type Key = Brand<string, 'Key'>

interface WrapperSchema<T extends BaseSchema, B> extends BaseSchema {
  kind: 'wrapper'
  wrappedSchema: T
  wrapperIso: Iso<FlatValue<T>, B>
  [TypeInformation]?: {
    FlatValue: Key
    JSONValue: B
  }
}

function identityIso<A>(): Iso<A, A> {
  return {
    to: (a: A) => a,
    from: (a: A) => a,
  }
}

const wrap = <T extends BaseSchema, B = JSONValue<T>>(
  wrappedSchema: T,
  wrapperIso: Iso<JSONValue<T>, B>,
): WrapperSchema<T, B> => ({
  kind: 'wrapper',
  wrappedSchema,
  wrapperIso,
})

const Paragraph = wrap(Text, {
  to: (text) => ({ type: 'paragraph' as const, value: text }),
  from: (b): string => b.value,
})

export type ParagraphFlat = FlatValue<typeof Paragraph>
export type ParagraphJSON = JSONValue<typeof Paragraph>

const Root = wrap(Paragraph, identityIso<JSONValue<typeof Paragraph>>())

export type RootFlat = FlatValue<typeof Root>
export type RootJSON = JSONValue<typeof Root>
