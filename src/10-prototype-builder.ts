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

console.log(Object.keys({ a: 1, b: 2 })) // ['a', 'b']
