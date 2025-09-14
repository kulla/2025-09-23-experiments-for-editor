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

type TreeNodeType<JSONValue = unknown> = new (
  value: JSONValue,
) => TreeNode<JSONValue>

class TextType extends TreeNode<string> {
  override storeValue(store: EditorStore) {
    return store.insert(() => this.jsonValue)
  }
}

function createArrayType<J, C extends TreeNodeType<J>>(childType: C) {
  return class extends TreeNode<J[]> {
    override storeValue(store: EditorStore) {
      return store.insert(() =>
        this.children.map((child) => child.storeValue(store)),
      )
    }

    get children() {
      return this.jsonValue.map((child) => new childType(child))
    }
  }
}

const TextContentType = createArrayType<string, typeof TextType>(TextType)

const store = new EditorStore()

const content = new TextContentType(['Hello', ' ', 'World!'])

content.storeValue(store)

content.children

for (const [key, value] of store.getEntries()) {
  console.log(`${key}: ${value}`)
}
