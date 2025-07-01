import Page, { PageElement } from '../page'

export default class AdditionalSupportPage extends Page {
  constructor() {
    super('Is additional support needed for any of the visitors?')
  }

  selectYes = (): void => {
    cy.get('[data-test="support-required-yes"]').check()
  }

  selectNo = (): void => {
    cy.get('[data-test="support-required-no"]').check()
  }

  enterSupportDetails = (details: string): PageElement => cy.get('#additionalSupport').type(details)

  continue = (): void => {
    cy.get('[data-test="continue-button"]').click()
  }
}
