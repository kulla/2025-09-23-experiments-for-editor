interface Foo {
  bar: string | number
  getBar(): this['bar']
}

type Foo2 = Foo & { bar: string }

const foo: Foo2 = {
  bar: 'hello',
  getBar() {
    return this.bar
  },
}

export const a = foo.getBar()

export type R = ReturnType<Foo['getBar']>
export type R2 = ReturnType<Foo2['getBar']>
