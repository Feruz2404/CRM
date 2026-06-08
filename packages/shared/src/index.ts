export type Brand<K, T> = K & { __brand: T };

export function assertUnreachable(_x: never): never {
	throw new Error('Unreachable');
}
