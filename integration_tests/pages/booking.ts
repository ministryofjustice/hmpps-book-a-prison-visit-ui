import Page, { PageElement } from './page'

export default class BookingsPage extends Page {
  constructor() {
    super('Booking')
  }

  visitDate = (): PageElement => cy.get('[data-test=visit-date]')

  visitStartTime = (): PageElement => cy.get('[data-test=visit-start-time]')

  visitEndTime = (): PageElement => cy.get('[data-test=visit-end-time]')

  visitReference = (): PageElement => cy.get('[data-test=visit-reference]')
}
