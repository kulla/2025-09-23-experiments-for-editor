import type { F } from 'ts-toolbelt'

function isString(value: unknown): value is string {
  return typeof value === 'string'
}

type isStringType = typeof isString // (value: unknown) => value is string
type GuardedType<S extends F.Function> = S extends (
  value: unknown,
) => value is infer R
  ? R
  : unknown

export type A = GuardedType<isStringType> // unknown
