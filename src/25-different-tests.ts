type Branded<K, T> = K & { __brand: T }
type Key = Branded<string, 'Key'>

type WithType<D, T> = D & { __type: T }

interface Type {
  foo(key: WithType<Key, this>): void
}

const obj: Type = {
  foo(key) {
    console.log(key)
  },
}

const key = 'myKey' as Key

// @ts-expect-error
obj.foo(key)

function getTypeAndKey(key: Key): { type: Type; key: WithType<Key, Type> } {
  return {
    key: key as WithType<Key, Type>,
    type: obj,
  }
}

const { type, key: typedKey } = getTypeAndKey(key)

type.foo(typedKey)
