function withDefault<A>(d: A) {
  return (v: A | null) => v ?? d
}

function toFactory<T extends (...args: unknown[]) => unknown>(create: T) {
  return { create }
}
const defaultF = toFactory(withDefault)

export const stringDefault = defaultF.create<string>('hello')
export const stringDefault2 = withDefault('hello')

export const a = defaultF.create<number>(0)
