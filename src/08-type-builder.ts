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

  extend<I2 extends Abstract<T>>(ext: (Base: I) => I2) {
    return this.withImplementation(ext(this.impl))
  }

  build() {
    return this.impl as A.Compute<I>
  }

  finish(this: this & { impl: T }) {
    return this.impl as T
  }

  static create<T extends object>() {
    return new TypeBuilder<T, object>({})
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

export const extendedFooType = TypeBuilder.create<Foo>()
  .withImplementation(fooType)
  .extend((Base) => ({
    foo() {
      const foo = Base.foo.call(this)
      return `${foo}:extended`
    },
  }))
  .build()

console.log(
  TypeBuilder.create<Foo>()
    .withImplementation(extendedFooType)
    .withImplementation({ bar: 'baz' })
    .finish()
    .foo(),
)

// @ts-expect-error (.finish() returns an error here because `bar` is missing)
export const unfinishedFooType = TypeBuilder.create<Foo>()
  .withImplementation(fooType)
  .finish()

export const finishedFooType = TypeBuilder.create<Foo>()
  .withImplementation(fooType)
  .withImplementation({ bar: 'baz' as string | number })
  .finish()
