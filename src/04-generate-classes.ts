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
  public abstract readonly jsonValue: JSONValue
  abstract storeValue(store: EditorStore): Key
}

interface NodeType<JSONValue = unknown> {
  createTreeNode(value: JSONValue): TreeNode<JSONValue>
}

const TextType = {
  klass: class extends TreeNode<string> {
    constructor(public readonly jsonValue: string) {
      super()
    }
    override storeValue(store: EditorStore) {
      return store.insert(() => this.jsonValue)
    }
  },
  createTreeNode(value: string) {
    return new this.klass(value)
  },
}

function createArrayType<J, C extends NodeType<J>>(childType: C) {
  return {
    klass: class extends TreeNode<J[]> {
      constructor(public readonly jsonValue: J[]) {
        super()
      }
      override storeValue(store: EditorStore) {
        const children = this.jsonValue.map((child) =>
          childType.createTreeNode(child),
        )
        return store.insert(() =>
          children.map((child) => child.storeValue(store)),
        )
      }
    },
    createTreeNode(value: J[]) {
      return new this.klass(value)
    },
  }
}

const TextContentType = createArrayType(TextType)

const store = new EditorStore()

const content = TextContentType.createTreeNode(['Hello', ' ', 'World!'])

content.storeValue(store)

// console.log('children', content.children)

for (const [key, value] of store.getEntries()) {
  console.log(`${key}: ${value}`)
}
