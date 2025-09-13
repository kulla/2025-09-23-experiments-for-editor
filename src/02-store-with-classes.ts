class EditorStore {
	private lastKey = 0;
	private entities = new Map<string, unknown>();

	insert(createValue: (key: string) => unknown) {
		const key = this.generateKey();
		const value = createValue(key);
		this.entities.set(key, value);
		return key;
	}

	private generateKey() {
		this.lastKey += 1;
		return this.lastKey.toString();
	}
}
