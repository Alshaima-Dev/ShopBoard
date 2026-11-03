// Both persistence stores use only these two browser-storage methods.
export type StorageAdapter = Pick<Storage, 'getItem' | 'setItem'>
