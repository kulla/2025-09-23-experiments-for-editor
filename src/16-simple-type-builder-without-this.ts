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

class TypeBuilder<T extends object, I extends object> {
  constructor(public readonly impl: I) {}

  extend<I2 extends object>(ext: I2 | ((Base: I) => I2)) {
    const newImpl = typeof ext === 'function' ? ext(this.impl) : ext

    return new TypeBuilder<T, MergeRight<I, I2>>(mergeRight(this.impl, newImpl))
  }

  extendType<T2 extends object>() {
    return new TypeBuilder<MergeRight<T, T2>, I>(this.impl)
  }

  finish(this: { impl: T }): T {
    return this.impl
  }

  static begin<Target extends object>(): TypeBuilder<Target, object>
  static begin<Target extends object>(impl: Target): TypeBuilder<Target, Target>
  static begin<Target extends object>(impl = {}) {
    return new TypeBuilder<Target, object>(impl)
  }
}

interface Foo {
  bar: string | number
  getBar(): string | number
}

export const fooType = TypeBuilder.begin<Foo>()
  .extend({
    getBar() {
      // Here we use `fooType` directly instead of `this`
      return fooType.bar
    },
  })
  .extend({ bar: 'default' })
  .finish()

interface Foo2 extends Foo {
  baz: boolean
  getBaz(): boolean
  describe(): string
}

export const abstractFoo2Type = TypeBuilder.begin(fooType)
  .extendType<Foo2>()
  .extend({
    baz: true,
    getBaz() {
      return abstractFoo2Type.impl.baz
    },
  })

export const foo2Type = abstractFoo2Type
  .extend({
    describe() {
      return 'Hello World'
    },
  })
  .finish()
