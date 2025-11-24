import Page, { PageElement } from '../page'

export default class CheckVisitorDetailsPage extends Page {
  constructor() {
    super('Check your request')
  }

  firstName = (): PageElement => cy.get('[data-test=first-name]')

  lastName = (): PageElement => cy.get('[data-test=last-name]')

  dateOfBirth = (): PageElement => cy.get('[data-test=date-of-birth]')

  submit = (): void => {
    cy.get('[data-test="submit"]').click()
  }
}
