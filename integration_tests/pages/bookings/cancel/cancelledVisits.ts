import Page, { PageElement } from '../../page'

export default class CancelledVisitsPage extends Page {
  constructor() {
    super('Cancelled visits')
  }

  visitDate = (index: number): PageElement => cy.get(`[data-test=visit-date-${index}]`)

  visitStartTime = (index: number): PageElement => cy.get(`[data-test=visit-start-time-${index}]`)

  visitEndTime = (index: number): PageElement => cy.get(`[data-test=visit-end-time-${index}]`)

  visitLink = (index: number): PageElement => cy.get(`[data-test=visit-link-booking-${index}]`)
}
