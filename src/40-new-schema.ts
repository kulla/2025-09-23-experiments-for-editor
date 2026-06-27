interface Methods {
  toString(): string
}

interface Text {
  text: string
}

function textToString(this: Text) {
  return this.text
}

class A implements Text {
  constructor(public text: string) {}

  toString = textToString
}

const foo = new A('Hello World')

console.log(foo.toString())
