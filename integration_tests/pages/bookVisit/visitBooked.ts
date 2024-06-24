import Page, { PageElement } from '../page'

export default class VisitBookedPage extends Page {
  constructor() {
    super('Booking confirmed')
  }

  bookingReference = (): PageElement => cy.get('[data-test="booking-reference"]')

  phoneNumberText = (): PageElement => cy.get('[data-test="phone-number-text"]')
}
