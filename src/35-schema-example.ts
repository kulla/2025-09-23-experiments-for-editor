interface StringSchema {
  type: 'string'
}
interface ArraySchema<C extends Schema = Schema> {
  type: 'array'
  child: C
}
interface ObjectSchema<
  T extends Record<string, Schema> = Record<string, Schema>,
> {
  type: 'object'
  properties: T
}

type Schema = StringSchema | ArraySchema | ObjectSchema

const S = {
  string: { type: 'string' } as StringSchema,
  array<C extends Schema>(child: C): ArraySchema<C> {
    return { type: 'array', child }
  },
  object<T extends Record<string, Schema>>(properties: T) {
    return { type: 'object', properties }
  },
}

type _JSONValue<S> = S extends StringSchema
  ? string
  : S extends ArraySchema<infer E>
    ? ReadonlyArray<_JSONValue<E>>
    : S extends ObjectSchema<infer T>
      ? { readonly [K in keyof T]: _JSONValue<T[K]> }
      : never

type JSONValue<S> = [S] extends [unknown] ? _JSONValue<S> : never

interface NestedNode<S extends Schema = Schema> {
  schema: S
  value: JSONValue<S>
}

type Branded<T, B> = T & { __brand: B }
type Key = Branded<string, 'Key'>

type FlatValue<S = Schema> = S extends ObjectSchema<infer T>
  ? { [K in keyof T]: Key }
  : S extends ArraySchema
    ? ReadonlyArray<Key>
    : Key

interface FlatNode<S extends Schema = Schema> {
  schema: S
  value: FlatValue<S>
}

interface URItoKind<A extends Schema> {
  FlatNode: FlatNode<A>
  NestedNode: NestedNode<A>
}
type URIS = keyof URItoKind<Schema>
type Kind<F extends URIS, A extends Schema> = URItoKind<A>[F]

interface NodeClass<F extends URIS> {
  getProperty<T extends Record<string, Schema>, K extends keyof T>(
    node: Kind<F, ObjectSchema<T>>,
    key: K,
  ): Kind<F, T[K]>
}

const NestedNodeClass: NodeClass<'NestedNode'> = {
  getProperty(node, key) {
    const value = node.value[key]
    return { schema: node.schema.properties[key], value }
  },
}

const FlatNodeClass = (map: Map<Key, FlatValue>): NodeClass<'FlatNode'> => ({
  getProperty(node, key) {
    const keyValue = node.value[key]
    const value = map.get(keyValue) as FlatValue<
      (typeof node.schema.properties)[typeof key]
    >

    return { schema: node.schema.properties[key], value }
  },
})

export function jsonGetProperty<
  T extends Record<string, Schema>,
  K extends keyof T,
>(node: NestedNode<ObjectSchema<T>>, key: K): NestedNode<T[K]> {
  const value = node.value[key]

  return { schema: node.schema.properties[key], value }
}

export function flatGetProperty<
  P extends Record<string, Schema>,
  K extends keyof P,
>(
  p: FlatNode<ObjectSchema<P>>,
  key: K,
  map: Map<Key, FlatValue>,
): FlatNode<P[K]> {
  const keyValue = p.value[key]
  const value = map.get(keyValue) as FlatValue<P[K]>

  return { schema: p.schema.properties[key], value }
}
