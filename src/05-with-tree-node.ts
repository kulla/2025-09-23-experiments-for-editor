type Key = string & { __brand: 'Key' }

class EditorStore {
  private lastKey = 0
  private entities = new Map<Key, unknown>()

  insert(createValue: (key: Key) => unknown) {
    const key = this.generateKey()
    const value = createValue(key)
    this.entities.set(key, value)
    return key
  }

  get(key: Key) {
    return this.entities.get(key)
  }

  getEntries() {
    return Array.from(this.entities.entries())
  }

  private generateKey() {
    this.lastKey += 1
    return this.lastKey.toString() as Key
  }
}

abstract class TreeNode<JSONValue> {
  constructor(public readonly jsonValue: JSONValue) {}
  abstract storeValue(store: EditorStore): Key
}

abstract class FlatNode<JSONValue, EntryValue> {
  constructor(
    public readonly store: EditorStore,
    public readonly key: Key,
  ) {}

  abstract readValue(): JSONValue

  get entryValue(): EntryValue {
    return this.store.get(this.key) as EntryValue
  }
}

const TextType = {
  TreeNode: class extends TreeNode<string> {
    override storeValue(store: EditorStore) {
      return store.insert(() => this.jsonValue)
    }

    get text() {
      return this.jsonValue
    }
  },
  FlatNode: class extends FlatNode<string, string> {
    override readValue() {
      return this.entryValue
    }
  },
}

function ArrayNode<
  J,
  E,
  T extends TreeNode<J>,
  F extends FlatNode<J, E>,
>(childType: {
  TreeNode: new (value: J) => T
  FlatNode: new (store: EditorStore, key: Key) => F
}) {
  return {
    TreeNode: class extends TreeNode<J[]> {
      override storeValue(store: EditorStore) {
        return store.insert(() =>
          this.children.map((child) => child.storeValue(store)),
        )
      }

      get children() {
        return this.jsonValue.map((child) => new childType.TreeNode(child))
      }
    },
    FlatNode: class extends FlatNode<J[], Key[]> {
      override readValue() {
        return this.entryValue.map((key) =>
          new childType.FlatNode(this.store, key).readValue(),
        )
      }

      get children() {
        return this.entryValue.map(
          (key) => new childType.FlatNode(this.store, key),
        )
      }
    },
  }
}

const TextContentType = ArrayNode(TextType)

const store = new EditorStore()

const content = new TextContentType.TreeNode(['Hello', ' ', 'World!'])

const key = content.storeValue(store)

console.log('---')

const firstChild = content.children[0]
if (firstChild) console.log(firstChild.text)

console.log('---')

for (const [key, value] of store.getEntries()) {
  console.log(`${key}: ${value}`)
}

console.log('---')

console.log(new TextContentType.FlatNode(store, key).readValue())
