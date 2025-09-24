import { A } from 'ts-toolbelt'

interface Foo {
  bar: string | number
  getBar(): string | number
  foo(): string | number
}

type Abstract<T extends object> = {
  [K in keyof T]?: T[K] extends (...args: infer A) => infer R
    ? (this: T, ...args: A) => R
    : never
}

type AbstractedFoo = Abstract<Foo>
type Merge<A extends object, B extends object> = {
  [K in keyof A | keyof B]: K extends keyof A
    ? K extends keyof B
      ? A[K] & B[K]
      : A[K]
    : K extends keyof B
      ? B[K]
      : never
}

class TypeBuilder<T extends object, I extends Abstract<T>> {
  constructor(public readonly impl: I) {}

  extend<I2 extends Abstract<T>>(impl2: I2) {
    return new TypeBuilder<T, I & I2>({ ...this.impl, ...impl2 })
  }

  static implement<T extends object>() {
    return new TypeBuilder<T, object>({})
  }

  get implementation() {
    return this.impl as A.Compute<I>
  }
}

const fooType = TypeBuilder.implement<Foo>()
  .extend({
    getBar() {
      return this.bar
    },
  })
  .extend({
    foo() {
      return this.bar
    },
  }).implementation

