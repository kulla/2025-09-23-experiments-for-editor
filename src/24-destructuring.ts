interface FooArg {
  data: { title: string; value: [number, number] }
}

function foo({
  data: {
    title,
    value: [min, max],
  },
}: FooArg) {
  console.log(title, min, max)
}

foo({ data: { title: 'Size', value: [10, 20] } })
