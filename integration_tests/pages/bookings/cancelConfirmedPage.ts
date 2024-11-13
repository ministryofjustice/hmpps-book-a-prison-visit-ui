import Page, { PageElement } from '../page'

export default class CancelConfirmedPage extends Page {
  constructor() {
    super('Booking cancelled')
  }

  phoneNumberText = (): PageElement => cy.get(`[data-test=phone-number-text]`)
}
