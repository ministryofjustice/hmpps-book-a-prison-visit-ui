import Page, { PageElement } from '../page'

export default class MainContactPage extends Page {
  constructor() {
    super('Who is the main contact for this booking?', {
      // Known issue with radio conditional reveal. See:
      // https://github.com/alphagov/govuk-frontend/issues/979
      axeRulesToIgnore: ['aria-allowed-attr'],
    })
  }

  firstVisitor = (): PageElement =>
    cy.get(':nth-child(2) > .govuk-fieldset > .govuk-radios > :nth-child(1) > .govuk-label')

  selectFirstVisitor = (): void => {
    cy.get('#contact').check()
  }

  selectPhoneNumber = (): void => {
    cy.get('#phoneNumber').check()
  }

  enterPhoneNumber = (number: string): PageElement => cy.get('#phoneNumberInput').type(number)

  continue = (): void => {
    cy.get('[data-test="continue-button"]').click()
  }
}
