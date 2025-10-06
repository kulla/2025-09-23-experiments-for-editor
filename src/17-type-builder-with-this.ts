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

interface NodeType {
  getParentKey(store: Store, key: string): string | null
  guard: Guard<this['__spec__']['valueType']>
  getValue(store: Store, key: string): this['__spec__']['valueType']
  __spec__: { valueType: unknown }
}

const abstractNodeType = TypeBuilder.begin<NodeType>()
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

type NonRootNodeType = TargetType<typeof abstractNonRootType>
const abstractNonRootType = abstractNodeType
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

export const stringType = abstractNonRootType
  .extendType<{ __spec__: { valueType: string } }>()
  .extend({
    guard(value) {
      return typeof value === 'string'
    },
  })
  .finish()

function array<T extends NonRootNodeType>(itemType: T) {
  return abstractNonRootType
    .extendType<{
      __spec__: { valueType: Array<T['__spec__']['valueType']> }
    }>()
    .extend({
      guard(value) {
        return Array.isArray(value) && value.every((v) => itemType.guard(v))
      },
    })
}

const stringArrayType = array(stringType).finish()
