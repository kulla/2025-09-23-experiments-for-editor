import type { getParentKey } from './14-api-proposal'

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

type Guard<T> = (value: unknown) => value is T

interface Store {
  get<T>(guard: Guard<T>, key: string): T
  getParentKey(key: string): string | null
}

interface NodeType<V> {
  getParentKey(store: Store, key: string): string | null
  guard: Guard<V>
  getValue(store: Store, key: string): V
  __spec__: V
}

function createAbstractNodeType<V>() {
  return TypeBuilder.begin<NodeType<V>>()
    .extend({
      getParentKey(store, key) {
        return store.getParentKey(key)
      },
    })
    .extend({
      getValue(store, key) {
        return store.get(this.guard, key)
      },
    })
    .extend({
      __spec__: undefined as never,
    })
}

type NonRootNodeType = TargetType<ReturnType<typeof createAbstractNonRoot>>
function createAbstractNonRoot<V>() {
  return createAbstractNodeType<V>()
    .extendType<{ getParentKey(store: Store, key: string): string }>()
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

export const stringType = createAbstractNonRoot<string>()
  .extend({
    guard(value) {
      return typeof value === 'string'
    },
  })
  .finish()

function array<T extends NonRootNodeType>(itemType: T) {
  return createAbstractNonRoot<Array<T['__spec__']>>()
    .extendType<{ getChildren(store: Store, key: string): T['__spec__'][] }>()
    .extend({
      guard(value): value is Array<T['__spec__']> {
        return Array.isArray(value) && value.every((v) => itemType.guard(v))
      },
    })
    .extend({
      getChildren(store, key) {
        return this.getValue(store, key)
      },
    })
}

export const stringArrayType = array(stringType)
  .extendType<{ foo(store: Store, key: string): void }>()
  .extend({
    foo(...args) {
      console.log(this.getChildren(...args))
    },
  })
  .finish()
