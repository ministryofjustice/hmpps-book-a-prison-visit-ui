import Page, { PageElement } from '../../page'

export default class CancelConfirmedPage extends Page {
  constructor() {
    super('Booking cancelled')
  }

  confirmationNotificationMessage = (): PageElement => cy.get('[data-test="confirmation-notification-message"]')
}
