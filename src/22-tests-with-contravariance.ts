// Both consume and produce A -> invariant
interface FooInv<A> {
  d(a: [A, ...string[]], ...args: string[]): void // input (contravariant pressure)
  //get(): A;                 // output (covariant pressure)
}

// Mutable property is inherently invariant (read + write)
/*interface FooInv2<A> {
  value: A // can read and write
}*/

let a: FooInv<string | number> = {
  d() {},
  // get: () => 2,
}
const b: FooInv<number> = {
  d([t]) {
    console.log(t ** 2 + 1)
  },
  // get: () => 2,
}

a = b
// b = a

a.d(['ddd'], 'rrr')
