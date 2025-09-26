import type { F, O } from 'ts-toolbelt'

interface Foo {
  bar: string
  getBar(): string
}

type PickKeys<T extends object, V> = {
  [K in keyof T]-?: T[K] extends V ? K : never
}[keyof T]
type PrototypeOf<T extends object> = {
  [K in PickKeys<T, F.Function>]: T[K]
} & ThisType<T>
type DataOf<T extends object> = O.Filter<T, F.Function>

export type FooPrototype = PrototypeOf<Foo> // { getBar: () => string }
export type FooData = DataOf<Foo> // { bar: string }

export const fooProtoTest: FooPrototype = {
  getBar() {
    return this.bar
  },
}

interface AbstractType<T extends object, A extends Partial<PrototypeOf<T>>> {
  readonly __type__: T
  readonly prototype: A
}

interface ConcreteType<T extends object>
  extends AbstractType<T, PrototypeOf<T>> {
  create(this: T, data: DataOf<T>): T
}
