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

abstract class EditorNode<JsonValue = unknown> {
  constructor(public readonly jsonValue: JsonValue) {}

  abstract storeValue(store: EditorStore): Key
}

type JSONValue<N extends EditorNode> = N['jsonValue']

class TextNode extends EditorNode<string> {
  storeValue(store: EditorStore) {
    return store.insert(() => this.jsonValue)
  }
}

abstract class ArrayNode<ChildNode extends EditorNode> extends EditorNode<
  JSONValue<ChildNode>[]
> {
  abstract createItemNode(
    itemJsonValue: JSONValue<ChildNode>,
  ): EditorNode<JSONValue<ChildNode>>

  storeValue(store: EditorStore) {
    return store.insert(() =>
      this.children.map((child) => child.storeValue(store)),
    )
  }

  get children() {
    return this.jsonValue.map((item) => this.createItemNode(item))
  }
}

class TextContent extends ArrayNode<TextNode> {
  createItemNode(itemJsonValue: string): EditorNode<string> {
    return new TextNode(itemJsonValue)
  }
}

const store = new EditorStore()

const content = new TextContent(['Hello', ' ', 'World!'])

content.storeValue(store)

// console.log('children', content.children)

for (const [key, value] of store.getEntries()) {
  console.log(`${key}: ${value}`)
}
