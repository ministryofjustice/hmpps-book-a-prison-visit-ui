import Page, { PageElement } from '../page'

export default class VisitBookedPage extends Page {
  constructor() {
    super('Booking confirmed')
  }

  bookingReference = (): PageElement => cy.get('[data-test="booking-reference"]')

  prisonSpecificContent = (): PageElement => cy.get('[data-test="prison-specific-content"]')
}
