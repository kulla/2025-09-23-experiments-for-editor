import type { A } from 'ts-toolbelt'

interface Foo {
  bar: string | number
  getBar(): string | number
  foo(): string | number
}

type Abstract<T extends object> = {
  [K in keyof T]?: T[K] extends (...args: infer A) => infer R
    ? (this: T, ...args: A) => R
    : T[K]
}

class TypeBuilder<T extends object, I extends Abstract<T>> {
  constructor(public readonly impl: I) {}

  withImplementation<I2 extends Abstract<T>>(impl2: I2) {
    return new TypeBuilder<T, I & I2>({ ...this.impl, ...impl2 })
  }

  static create<T extends object>() {
    return new TypeBuilder<T, object>({})
  }

  build() {
    return this.impl as A.Compute<I>
  }

  finish(this: this & { impl: T }) {
    return this.impl
  }
}

export const fooType = TypeBuilder.create<Foo>()
  .withImplementation({
    getBar() {
      return this.bar
    },
  })
  .withImplementation({
    foo() {
      return this.bar
    },
  })
  .build()

// @ts-expect-error (.finish() returns an error here because `bar` is missing)
export const unfinishedFooType = TypeBuilder.create<Foo>()
  .withImplementation(fooType)
  .finish()

export const finishedFooType = TypeBuilder.create<Foo>()
  .withImplementation(fooType)
  .withImplementation({ bar: 'baz' as string | number })
  .finish()
