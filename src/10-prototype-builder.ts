import type { F, O } from 'ts-toolbelt'

interface Foo {
  bar: string
  getBar(): string
}

type PickKeys<T extends object, V> = Exclude<keyof T, O.FilterKeys<T, V>>
type PrototypeOf<T extends object> = {
  [K in PickKeys<T, F.Function>]: T[K] extends (
    this: infer U,
    ...args: infer A
  ) => infer R
    ? (this: U & T, args: A) => R
    : never
}
type DataOf<T extends object> = O.Filter<T, F.Function>

export type FooPrototype = PrototypeOf<Foo> // { getBar: () => string }
export type FooData = DataOf<Foo> // { bar: string }

interface AbstractType<T extends object, A extends Partial<PrototypeOf<T>>> {
  readonly __type__: T
  readonly prototype: A
}

interface ConcreteType<T extends object>
  extends AbstractType<T, PrototypeOf<T>> {
  new (data: DataOf<T>): T & { type: AbstractType<T, PrototypeOf<T>> }
}
