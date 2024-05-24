import Page, { PageElement } from '../page'

export default class SelectAdditionalSupportPage extends Page {
  constructor() {
    super('Is additional support needed for any of the visitors?', {
      // Known issue with radio conditional reveal. See:
      // https://github.com/alphagov/govuk-frontend/issues/979
      axeRulesToIgnore: ['aria-allowed-attr'],
    })
  }

  selectYes = (): void => {
    cy.get('[data-test="support-required-yes"]').check()
  }

  enterSupportDetails = (details: string): PageElement => cy.get('#additionalSupport').type(details)

  continue = (): void => {
    cy.get('[data-test="continue-button"]').click()
  }
}
