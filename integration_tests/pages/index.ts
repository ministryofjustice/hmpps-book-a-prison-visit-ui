import Page, { PageElement } from './page'

export default class IndexPage extends Page {
  constructor() {
    super('Book a visit')
  }

  headerPhaseBanner = (): PageElement => cy.get('[data-qa=header-phase-banner]')

  prisonerName = (): PageElement => cy.get('[data-test=prisoner-name]')
}
