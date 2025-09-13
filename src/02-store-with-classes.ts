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
    protected store: EditorStore,
    protected jsonValue: JsonValue,
  ) {}

  abstract storeValue(): Key
}

class TextNode extends EditorNode<string> {
  storeValue() {
    return this.store.insert(() => this.jsonValue)
  }
}

class TextContent extends EditorNode<string[]> {
  storeValue() {
    return this.store.insert(() =>
      this.jsonValue.map((text) => new TextNode(this.store, text).storeValue()),
    )
  }
}

const store = new EditorStore()

new TextContent(store, ['Hello', ' ', 'World!']).storeValue()

for (const [key, value] of store.getEntries()) {
  console.log(`${key}: ${value}`)
}
