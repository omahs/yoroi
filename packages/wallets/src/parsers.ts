import {z} from 'zod'

// -------
// PARSERS
export const parseBoolean = (data: unknown) => {
  const parsed = parseSafe(data)
  return isBoolean(parsed) ? parsed : undefined
}
export const parseString = (data: unknown) => {
  const parsed = parseSafe(data)
  return isString(parsed) ? parsed : undefined
}

export const parseSafe = (text: any) => {
  try {
    return JSON.parse(text) as unknown
  } catch (_) {
    return undefined
  }
}

// -----------
// TYPE GUARDS
export const isBoolean = (data: unknown): data is boolean =>
  typeof data === 'boolean'

export const isString = (data: unknown): data is string =>
  typeof data === 'string'

export const isNonNullable = <T>(data: T | null | undefined): data is T =>
  data !== null && data !== undefined

export const isNumber = (data: unknown): data is number =>
  typeof data === 'number' && !Number.isNaN(data) && Number.isFinite(data)

export const createTypeGuardFromSchema =
  <T>(schema: z.ZodType<T>) =>
  (data: unknown): data is T => {
    return schema.safeParse(data).success
  }

export const isRecord = createTypeGuardFromSchema<Record<string, unknown>>(
  z.record(z.unknown()),
)

export const isArray = createTypeGuardFromSchema<unknown[]>(
  z.array(z.unknown()),
)

export function isArrayOfType<T>(
  data: unknown,
  predicate: (data: unknown) => data is T,
): data is Array<T> {
  return isArray(data) && data.every(predicate)
}
