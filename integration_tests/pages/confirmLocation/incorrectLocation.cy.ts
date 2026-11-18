import Page, { PageElement } from '../page'

export default class IncorrectLocationPage extends Page {
  constructor(private readonly pageTitle: string) {
    super(pageTitle)
  }

  secondHeading = (): PageElement => cy.get('h2')

  findPrisonerLink = (): PageElement => cy.get('[data-test="find-prisoner-link"] > a')
}
