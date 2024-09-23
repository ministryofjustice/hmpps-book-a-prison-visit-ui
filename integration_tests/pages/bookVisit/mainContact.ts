import Page, { PageElement } from '../page'

export default class MainContactPage extends Page {
  constructor() {
    super('Who is the main contact for this booking?', {
      // Known issue with radio conditional reveal. See:
      // https://github.com/alphagov/govuk-frontend/issues/979
      axeRulesToIgnore: ['aria-allowed-attr'],
    })
  }

  selectVisitorByName = (name: string): void => {
    cy.get('label').contains(name).siblings('input[name=contact]').check()
  }

  checkHasPhoneNumber = (): void => {
    cy.get('#hasPhoneNumber').check()
  }

  enterPhoneNumber = (number: string): PageElement => cy.get('#phoneNumber').type(number)

  continue = (): void => {
    cy.get('[data-test="continue-button"]').click()
  }
}
