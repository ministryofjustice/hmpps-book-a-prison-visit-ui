import Page, { PageElement } from './page'

export default class BookingsPage extends Page {
  constructor() {
    super('Booking')
  }

  visitDate = (index: number): PageElement => cy.get(`[data-test=visit-date-${index}]`)

  visitStartTime = (index: number): PageElement => cy.get(`[data-test=visit-start-time-${index}]`)

  visitEndTime = (index: number): PageElement => cy.get(`[data-test=visit-end-time-${index}]`)

  visitReference = (index: number): PageElement => cy.get(`[data-test=visit-reference-${index}]`)
}
