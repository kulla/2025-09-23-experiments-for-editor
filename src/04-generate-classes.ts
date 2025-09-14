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

class TextType extends TreeNode<string> {
  override storeValue(store: EditorStore) {
    return store.insert(() => this.jsonValue)
  }

  get text() {
    return this.jsonValue
  }
}

function ArrayNode<J, N extends TreeNode<J>>(childType: new (value: J) => N) {
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

const TextContentType = ArrayNode(TextType)

const store = new EditorStore()

const content = new TextContentType(['Hello', ' ', 'World!'])

content.storeValue(store)

const firstChild = content.children[0]
if (firstChild) console.log(firstChild.text)

for (const [key, value] of store.getEntries()) {
  console.log(`${key}: ${value}`)
}
