declare namespace Cypress {
  interface Chainable {
    /**
     * Custom command to signIn. Set failOnStatusCode to false if you expect and non 200 return code
     * Optionally set nonce to override the value used in the ID token
     * @example cy.signIn({ failOnStatusCode: boolean })
     */
    signIn({
      options,
      nonce,
      initialRequestUrl,
      hideCookieBanner,
    }?: {
      options?: { failOnStatusCode: boolean }
      nonce?: string
      initialRequestUrl?: string
      hideCookieBanner?: boolean
    }): Chainable<unknown>

    hideCookieBanner(): Chainable<Cookie>
  }
}
