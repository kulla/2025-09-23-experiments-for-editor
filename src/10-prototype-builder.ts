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

class TypeBuilder<T extends object, P extends AbstractPrototypeOf<T>> {
  constructor(public readonly prototype: P) {}

  withMethods<P2 extends AbstractPrototypeOf<T>>(ext: P2 | ((Base: P) => P2)) {
    const extension = typeof ext === 'function' ? ext(this.prototype) : ext

    return new TypeBuilder<T, P & P2>({ ...this.prototype, ...extension })
  }

  forSubtype<T2 extends T>() {
    return {
      withSubtypeMethods: <P2 extends AbstractPrototypeOf<T2>>(
        ext: (Base: P) => P2,
      ) => new TypeBuilder<T2, P2>(ext(this.prototype)),
    }
  }

  static begin<T extends object>() {
    return new TypeBuilder<T, object>({})
  }
}

class ConcreteType<T extends object> extends TypeBuilder<T, PrototypeOf<T>> {
  create(data: DataOf<T>): T {
    return Object.setPrototypeOf(data, this.prototype)
  }
}
