import Page, { PageElement } from '../page'

export default class PvbPrisonPage extends Page {
  constructor(private readonly prison: string) {
    super(`${prison} does not use this service`)
  }

  pvbLink = (): PageElement => cy.get('[data-test="prison-directory-link"] > a')
}
