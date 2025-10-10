interface TreeNode {
  kind: 'tree'
  value: Value<TreeNode>
}

interface FlatNode {
  kind: 'flat'
  value: Value<Key>
}

const exampleTree: TreeNode = {
  kind: 'tree',
  value: {
    tag: 'object',
    data: {
      name: { kind: 'tree', value: { tag: 'primitive', data: 'root' } },
      children: {
        kind: 'tree',
        value: {
          tag: 'array',
          data: [
            { kind: 'tree', value: { tag: 'primitive', data: 'Child 1' } },
            { kind: 'tree', value: { tag: 'primitive', data: 'Child 2' } },
          ],
        },
      },
    },
  },
}

function getProperty<V>(
  obj: { value: ObjectValue<V> },
  key: string,
): V | undefined {
  return obj.value.data[key]
}

console.log(getProperty(exampleTree, 'name'))

type ArrayValue<V> = { tag: 'array'; data: V[] }
type ObjectValue<V> = { tag: 'object'; data: Record<string, V> }
type SingleValue<V> = { tag: 'single'; data: V }
type PrimitiveValue = { tag: 'primitive'; data: string | number | boolean }
type Value<V> = ArrayValue<V> | ObjectValue<V> | SingleValue<V> | PrimitiveValue

interface Storage {
  get(key: Key): Value<Key>
  set(key: Key, value: Value<Key>): void
}

export function createStorage(): Storage {
  const store = new Map<Key, Value<Key>>()

  return {
    get(key: Key): Value<Key> {
      const value = store.get(key)
      if (!value) {
        throw new Error(`Key not found: ${key}`)
      }
      return value
    },
    set(key: Key, value: Value<Key>): void {
      store.set(key, value)
    },
  }
}

type Key = Branded<string, 'Key'>
type Branded<T, B> = T & { __brand: B }
