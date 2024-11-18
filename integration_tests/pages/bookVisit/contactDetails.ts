import Page, { PageElement } from '../page'

export default class ContactDetailsPage extends Page {
  constructor(contactName: string) {
    super(`Contact details for ${contactName}`, {
      // Known issue with radio conditional reveal. See:
      // https://github.com/alphagov/govuk-frontend/issues/979
      axeRulesToIgnore: ['aria-allowed-attr'],
    })
  }

  checkGetUpdatesByEmail = (): void => {
    cy.get('input[name=getUpdatesBy][value=email]').check()
  }

  checkGetUpdatesByPhone = (): void => {
    cy.get('input[name=getUpdatesBy][value=phone]').check()
  }

  enterEmail = (email: string): PageElement => cy.get('#mainContactEmail').type(email)

  enterPhoneNumber = (number: string): PageElement => cy.get('#mainContactPhone').type(number)

  continue = (): void => {
    cy.get('[data-test="continue-button"]').click()
  }
}
