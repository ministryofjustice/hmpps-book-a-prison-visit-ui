import Page, { PageElement } from '../page'

export default class VisitBookedPage extends Page {
  constructor() {
    super('Visit booked')
  }

  visitReference = (): PageElement => cy.get('[data-test="visit-reference-title"]')

  confirmationNotificationMessage = (): PageElement => cy.get('[data-test="confirmation-notification-message"]')
}
