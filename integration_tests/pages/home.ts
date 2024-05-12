import Page, { PageElement } from './page'

export default class HomePage extends Page {
  constructor() {
    super('Book a visit')
  }

  prisonerName = (): PageElement => cy.get('[data-test=prisoner-name]')
}
