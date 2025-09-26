import type { A, F, O } from 'ts-toolbelt'

interface Foo {
  bar: string
  getBar(): string
}

type WithThis<TThis extends object, Func> = Func extends (
  this: infer U,
  ...args: infer A
) => infer R
  ? (this: TThis & U, ...args: A) => R
  : never
type PrototypeOf<T extends object> = {
  [K in O.SelectKeys<T, F.Function>]: WithThis<T, T[K]>
}
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

  extendType<T2>() {
    return {
      withMethods: <P2 extends AbstractPrototypeOf<T & T2>>(
        ext: P2 | ((Base: P) => P2),
      ) => {
        const extension = typeof ext === 'function' ? ext(this.prototype) : ext

        return new TypeBuilder<T & T2, P & P2>({
          ...this.prototype,
          ...extension,
        })
      },
    }
  }

  finish(this: this & { prototype: PrototypeOf<T> }) {
    return new ConcreteType<T>(this.prototype)
  }

  static begin<T extends object>() {
    // biome-ignore lint/complexity/noBannedTypes: {} is perfectly fine her
    return new TypeBuilder<T, {}>({})
  }
}

class ConcreteType<T extends object> extends TypeBuilder<T, PrototypeOf<T>> {
  create(data: DataOf<T>): T {
    const instance = Object.create(this.prototype)
    return Object.assign(instance, data) as T
  }
}

const fooType = TypeBuilder.begin<Foo>()
  .withMethods({
    getBar() {
      return this.bar
    },
  })
  .finish()

console.log(fooType.create({ bar: 'baz' }).getBar()) // 'baz'

const bazType = fooType
  .extendType<{ baz(): string }>()
  .withMethods({
    baz() {
      return this.bar + this.bar + this.bar
    },
  })
  .finish()

console.log(bazType.create({ bar: 'baz' }).baz())
