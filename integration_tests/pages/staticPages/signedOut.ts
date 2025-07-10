import Page, { PageElement } from '../page'

export default class SignedOutPage extends Page {
  constructor() {
    super('You have signed out')
  }

  signInLink = (): PageElement => cy.get('[data-test=sign-in]')
}
