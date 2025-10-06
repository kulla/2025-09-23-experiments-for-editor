import { invariant } from 'es-toolkit'

type Primitive = string | number | boolean
type Value<T> = Record<string, T> | T[] | T | Primitive

type NonRootKey = `${number}`
type RootKey = `root`
type Key = NonRootKey | RootKey
type FlatValue = Value<Key>

interface EditorStore {
  get<F extends FlatValue>(guard: (value: FlatValue) => value is F, key: Key): F
  save(value: FlatValue, parentKey: Key): NonRootKey
  attachRoot(value: FlatValue): RootKey
  getParentKey(key: Key): Key | null
  getEntries(): [Key, FlatValue][]
}

function createEditorStore(): EditorStore {
  const store = new Map<Key, FlatValue>()
  const parentMap = new Map<Key, Key | null>()
  let lastKey = 0

  return {
    get(guard, key) {
      const value = store.get(key)

      invariant(value !== undefined, `No value found for key: ${key}`)
      invariant(guard(value), `Value for key: ${key} does not match guard`)

      return value
    },
    save(value, parentKey) {
      const key = (lastKey++).toString() as NonRootKey
      store.set(key, value)
      parentMap.set(key, parentKey)
      return key
    },
    attachRoot(value) {
      const key = 'root' as RootKey
      store.set(key, value)
      parentMap.set(key, null)
      return key
    },
    getParentKey(key) {
      return parentMap.get(key) ?? null
    },
    getEntries() {
      return Array.from(store.entries())
    },
  }
}

type MergeRight<A, B> = {
  [K in keyof A | keyof B]: K extends keyof B
    ? B[K]
    : K extends keyof A
      ? A[K]
      : never
} & unknown

function mergeRight<A, B>(a: A, b: B): MergeRight<A, B> {
  return { ...a, ...b } as MergeRight<A, B>
}

type Abstract<T extends object> = {
  [K in keyof T]?: T[K] extends (...args: infer A) => infer R
    ? (this: T, ...args: A) => R
    : T[K]
}

class TypeBuilder<T extends object, I extends object> {
  constructor(public readonly impl: I) {}

  extend<I2 extends Abstract<T>>(ext: I2 | ((Base: I) => I2)) {
    const newImpl = typeof ext === 'function' ? ext(this.impl) : ext

    return new TypeBuilder<T, MergeRight<I, I2>>(mergeRight(this.impl, newImpl))
  }

  extendType<T2 extends object>() {
    return new TypeBuilder<MergeRight<T, T2>, I>(this.impl)
  }

  finish(this: TypeBuilder<T, T>): T {
    return this.impl
  }

  static begin<Target extends object>(): TypeBuilder<Target, object>
  static begin<Target extends object>(impl: Target): TypeBuilder<Target, Target>
  static begin<Target extends object>(impl = {}) {
    return new TypeBuilder<Target, object>(impl)
  }
}

type TargetType<T> = T extends TypeBuilder<infer Target, object>
  ? Target
  : never

interface NodeSpec {
  FlatValue: Value<Key>
  JSONValue: unknown
}

interface NodeType<S extends NodeSpec> {
  toJson(store: EditorStore, key: Key): S['JSONValue']
  isFlatValue(value: unknown): value is S['FlatValue']
  getFlatValue(store: EditorStore, key: Key): S['FlatValue']
  getParentKey(store: EditorStore, key: Key): Key | null
  __spec__: S
}

function createAbstractNode<S extends NodeSpec>() {
  return TypeBuilder.begin<NodeType<S>>().extend({
    getFlatValue(store, key) {
      return store.get(this.isFlatValue, key)
    },
    getParentKey(store, key) {
      return store.getParentKey(key)
    },
    __spec__: undefined as never,
  })
}

interface NonRootType<S extends NodeSpec> extends NodeType<S> {
  getParentKey(store: EditorStore, key: Key): Key
  storeValue(
    store: EditorStore,
    value: S['JSONValue'],
    parentKey: Key,
  ): NonRootKey
}

function createAbstractNonRoot<S extends NodeSpec>() {
  return createAbstractNode<S>()
    .extendType<NonRootType<S>>()
    .extend((Base) => ({
      getParentKey(store, key) {
        const parentKey = Base.getParentKey.call(this, store, key)
        if (parentKey === null) {
          throw new Error('This node has no parent')
        }
        return parentKey
      },
    }))
}

export const stringType = createAbstractNonRoot<{
  JSONValue: string
  FlatValue: string
}>()
  .extend({
    isFlatValue(value): value is string {
      return typeof value === 'string'
    },
    toJson(store, key) {
      return this.getFlatValue(store, key)
    },
  })
  .extend({
    storeValue(store, value, parentKey) {
      return store.save(value, parentKey)
    },
  })
  .finish()

function array<C extends NodeSpec>(itemType: NonRootType<C>) {
  type ArraySpec = {
    JSONValue: C['JSONValue'][]
    FlatValue: Key[]
  }

  return createAbstractNonRoot<ArraySpec>()
    .extendType<{ getChildren(store: EditorStore, key: Key): Key[] }>()
    .extend({
      isFlatValue(value): value is Key[] {
        return Array.isArray(value) && value.every((v) => typeof v === 'string')
      },
      toJson(store, key) {
        return this.getChildren(store, key).map((childKey) =>
          itemType.toJson(store, childKey as Key),
        )
      },
    })
    .extend({
      getChildren(store, key) {
        return this.getFlatValue(store, key)
      },
    })
    .extend({
      storeValue(store, value, parentKey) {
        const childKeys = value.map((child) =>
          itemType.storeValue(store, child, parentKey),
        )
        return store.save(childKeys, parentKey)
      },
    })
}

export const stringArrayType = array(stringType)
  .extendType<{ foo(store: EditorStore, key: Key): void }>()
  .extend({
    foo(...args) {
      console.log(this.getChildren(...args))
    },
  })
  .finish()

// Example usage:
const store = createEditorStore()
const rootKey = 'root' as RootKey

store.attachRoot(
  stringArrayType.storeValue(store, ['Hello', ' ', 'World!'], rootKey),
)
