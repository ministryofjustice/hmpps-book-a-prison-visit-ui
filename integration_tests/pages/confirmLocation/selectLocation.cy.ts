import Page, { PageElement } from '../page'

export default class SelectLocationPage extends Page {
  constructor(private readonly data: { prisoner: string; prisonName: string }) {
    super(`${data.prisoner} is no longer at ${data.prisonName}`)
  }

  prisonDropdown = (prisonName: string): void => {
    cy.get('#prisonId').select(prisonName)
  }

  findPrisonerLink = (): PageElement => cy.get('[data-test="find-prisoner-link"] > a')

  continueButton = (): void => {
    cy.get('[data-test=continue-button]').click()
  }
}
