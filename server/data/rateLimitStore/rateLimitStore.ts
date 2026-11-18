export default interface RateLimitStore {
  incrementCount(key: string, windowSeconds: number): Promise<number>
}
