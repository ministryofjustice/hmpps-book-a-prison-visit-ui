import Page, { PageElement } from '../page'

export default class MainContactPage extends Page {
  constructor() {
    super('Who is the main contact for this booking?', {
      // Known issue with radio conditional reveal. See:
      // https://github.com/alphagov/govuk-frontend/issues/979
      axeRulesToIgnore: ['aria-allowed-attr'],
    })
  }

  getContactLabel = (contactDisplayId: number): PageElement =>
    cy.get(`input[name=contact][value=${contactDisplayId}] + label`)

  selectVisitor = (contactDisplayId: number): void => {
    cy.get(`input[name=contact][value=${contactDisplayId}]`).check()
  }

  checkHasPhoneNumber = (): void => {
    cy.get('#hasPhoneNumber').check()
  }

  enterPhoneNumber = (number: string): PageElement => cy.get('#phoneNumber').type(number)

  continue = (): void => {
    cy.get('[data-test="continue-button"]').click()
  }
}
