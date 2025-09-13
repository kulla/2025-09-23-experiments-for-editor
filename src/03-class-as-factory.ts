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

interface TreeNode {
  storeValue(store: EditorStore): Key
}

interface NodeType<JSONValue = unknown> {
  createTreeNode(value: JSONValue): TreeNode
}

const TextType: NodeType<string> = {
  createTreeNode(value: string): TreeNode {
    return {
      storeValue(store) {
        return store.insert(() => value)
      },
    }
  },
}

function createArrayType<J, C extends NodeType<J>>(
  childType: C,
): NodeType<J[]> {
  return {
    createTreeNode(value) {
      return {
        storeValue(store) {
          const children = value.map((child) => childType.createTreeNode(child))
          return store.insert(() =>
            children.map((child) => child.storeValue(store)),
          )
        },
      }
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
