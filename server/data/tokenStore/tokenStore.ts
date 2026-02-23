export type TokenStorePrefix = 'systemToken' | 'idToken' | 'rateLimit'

export interface TokenStore {
  setToken(key: string, token: string, durationSeconds: number): Promise<void>
  getToken(key: string): Promise<string | null>
  incrementCount(key: string, windowSeconds: number): Promise<number>
}
