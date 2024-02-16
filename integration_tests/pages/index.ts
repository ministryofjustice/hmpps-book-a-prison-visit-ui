import Page, { PageElement } from './page'

export default class IndexPage extends Page {
  constructor() {
    super('This site is under construction...')
  }

  headerPhaseBanner = (): PageElement => cy.get('[data-qa=header-phase-banner]')
}
