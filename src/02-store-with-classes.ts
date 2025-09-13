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
  constructor(
    public readonly store: EditorStore,
    public readonly jsonValue: JsonValue,
  ) {}

  abstract storeValue(): Key
}

type JSONValue<N extends EditorNode> = N['jsonValue']

class TextNode extends EditorNode<string> {
  storeValue() {
    return this.store.insert(() => this.jsonValue)
  }
}

abstract class ArrayNode<ChildNode extends EditorNode> extends EditorNode<
  JSONValue<ChildNode>[]
> {
  abstract createItemNode(
    itemJsonValue: JSONValue<ChildNode>,
  ): EditorNode<JSONValue<ChildNode>>

  storeValue() {
    return this.store.insert(() =>
      this.jsonValue.map((item) => this.createItemNode(item).storeValue()),
    )
  }
}

class TextContent extends ArrayNode<TextNode> {
  createItemNode(itemJsonValue: string): EditorNode<string> {
    return new TextNode(this.store, itemJsonValue)
  }
}

const store = new EditorStore()

new TextContent(store, ['Hello', ' ', 'World!']).storeValue()

for (const [key, value] of store.getEntries()) {
  console.log(`${key}: ${value}`)
}
