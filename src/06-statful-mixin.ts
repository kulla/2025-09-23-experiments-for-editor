class Transaction {
  foo() {}
}

type Writable = { tx: Transaction }

class Stateful {
  protected tx: Transaction | null = null

  constructor() {}

  toWritable(tx: Transaction) {
    this.tx = tx
    return this as this & Writable
  }

  copyState<That extends Stateful>(
    this: this & Writable,
    that: That,
  ): That & Writable
  copyState<That extends Stateful>(this: this, that: That): That
  copyState<That extends Stateful>(this: this, that: That): That {
    return this.tx ? that.toWritable(this.tx) : that
  }
}

class FlatNode<T extends string> extends Stateful {
  constructor(public type: T) {
    super()
  }

  getType() {
    return this.type
  }

  store(this: this & Writable) {
    this.tx.foo()
  }
}

class WrappedNode<T extends string, C extends string> extends FlatNode<T> {
  constructor(
    type: T,
    public _child: FlatNode<C>,
  ) {
    super(type)
  }

  getChild(this: this & Writable): FlatNode<C> & Writable
  getChild(this: this): FlatNode<C>
  getChild() {
    return this.copyState(this._child)
  }
}

const f = new FlatNode('test')

// @ts-expect-error
f.store()

const d = f.toWritable(new Transaction())

d.store()
d.type

const g = new WrappedNode('root', f)

const e = g.getChild()

// @ts-expect-error
e.store()

const h = g.toWritable(new Transaction())

const z = h.getChild()

z.store()
