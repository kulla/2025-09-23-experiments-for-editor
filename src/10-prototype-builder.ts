import type { F, O } from 'ts-toolbelt'

interface Foo {
  bar: string
  getBar(): string
}

type PrototypeOf<T extends object> = O.Select<T, F.Function> & ThisType<T>
type AbstractPrototypeOf<T extends object> = Partial<PrototypeOf<T>>
type DataOf<T extends object> = O.Filter<T, F.Function>

export type FooPrototype = PrototypeOf<Foo> // { getBar: () => string }
export type FooData = DataOf<Foo> // { bar: string }

export const fooProtoTest: FooPrototype = {
  getBar() {
    return this.bar
  },
}

class AbstractTypeBuilder<T extends object, P extends AbstractPrototypeOf<T>> {
  constructor(public readonly prototype: P) {}

  withMethods<P2 extends AbstractPrototypeOf<T>>(prototype: P2) {
    return new AbstractTypeBuilder<T, P & P2>({
      ...this.prototype,
      ...prototype,
    })
  }

  extend<P2 extends AbstractPrototypeOf<T>>(
    ext: (Base: P) => P2,
  ): AbstractTypeBuilder<T, P & P2> {
    return this.withMethods(ext(this.prototype))
  }

  extendType<T2 extends T>() {
    return {
      updateImplForNewType: <P2 extends AbstractPrototypeOf<T2>>(
        ext: (Base: P) => P2,
      ) => new AbstractTypeBuilder<T2, P2>(ext(this.prototype)),
    }
  }

  static begin<T extends object>() {
    return new AbstractTypeBuilder<T, object>({})
  }
}

interface ConcreteType<T extends object>
  extends AbstractTypeBuilder<T, PrototypeOf<T>> {
  create(this: T, data: DataOf<T>): T
}
