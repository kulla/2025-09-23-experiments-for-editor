import * as Y from 'yjs'

const ydoc = new Y.Doc()

const ytextNested = new Y.Text('Hello, World!')
const ymap = ydoc.getMap<Y.Text>('my map type')
ymap.set('nested text type', ytextNested)

console.log(ymap.get('nested text type')?.toString()) // "Hello, World!"

ymap.get('nested text type')?.insert(7, 'beautiful ')

console.log(ymap.get('nested text type')?.toString()) // "Hello, beautiful World!"
