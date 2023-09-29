export default function generateOauthClientToken(clientId: string, clientSecret: string): string {
  const token = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
  return `Basic ${token}`
}
