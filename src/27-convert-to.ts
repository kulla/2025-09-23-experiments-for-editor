interface ConvertTo<A, B> {
  convert(value: A): B
}

function display<A>(converter: ConvertTo<A, string>, value: A): void {
  const result = converter.convert(value)

  console.log('Result: ', result)
  console.log('Length: ', result.length)
}

const numberToStringConverter: ConvertTo<number, string> = {
  convert(value: number): string {
    return value.toString()
  },
}

display(numberToStringConverter, 123) // Output: "123"
