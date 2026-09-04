import Page, { PageElement } from '../page'

export default class SelectLocationPage extends Page {
  constructor(private readonly pageTitle: string) {
    super(pageTitle)
  }

  prisonDropdown = (prisonName: string): void => {
    cy.get('#prisonId').select(prisonName)
  }

  findPrisonerLink = (): PageElement => cy.get('[data-test="find-prisoner-link"] > a')

  continueButton = (): void => {
    cy.get('[data-test=continue-button]').click()
  }
}
