interface Foo {
  bar: string
  getBar(): string
}

interface FooPrototype {
  new (bar: string): Foo
  prototype: { getBar(this: Foo): string }
}

const FooClass = function (this: Foo, bar: string) {
  this.bar = bar
} as unknown as FooPrototype

FooClass.prototype.getBar = function () {
  return this.bar
}

console.log(new FooClass('baz').getBar()) // baz

interface FooProto {
  constructor: (this: Foo, bar: string) => void
  prototype: { getBar(this: Foo): string }
}

const FooProto: FooProto = {
  constructor: function (this: Foo, bar: string) {
    this.bar = bar
  },
  prototype: {
    getBar: function (this: Foo) {
      return this.bar
    },
  },
}

function createConstructor<T, A extends unknown[], P>(
  ctor: (this: T, ...args: A) => void,
  prototype: P,
): { new (...args: A): T; prototype: P } {
  ctor.prototype = prototype
  return ctor as unknown as { new (...args: A): T; prototype: P }
}

const FooCtor = createConstructor(FooProto.constructor, FooProto.prototype)

console.log(new FooCtor('baz').getBar()) // baz

const fooInstance = Object.create(FooCtor.prototype, {
  bar: { value: 'baz', writable: true, enumerable: true, configurable: true },
}) as Foo

console.log(fooInstance.getBar()) // baz
