type Guard<V> = (value: unknown) => value is V

type ObjectStorageTrait = { storage: { tag: 'object'; properties: string[] } }
type ArrayStorageTrait = { storage: { tag: 'array' } }
type SingleStorageTrait = { storage: { tag: 'single' } }
type PrimitiveStorageTrait = { storage: { tag: 'primitive' } }

type StorageTrait =
  | ObjectStorageTrait
  | ArrayStorageTrait
  | SingleStorageTrait
  | PrimitiveStorageTrait

type A = keyof StorageTrait['storage']

type Value<T> = ObjectValue<T> | ArrayValue<T> | SingleValue<T> | PrimitiveValue

type ObjectValue<T> = { tag: 'object'; value: Record<string, T> }
type ArrayValue<T> = { tag: 'array'; value: T[] }
type SingleValue<T> = { tag: 'single'; value: T }
type PrimitiveValue = { tag: 'primitive'; value: unknown }

interface TreeNode<S = StorageTrait> {
  value: Value<TreeNode> & { tag: keyof S }
}
