import Page, { PageElement } from '../../page'

export default class CancelledVisitsPage extends Page {
  constructor() {
    super('Rejected and cancelled visits')
  }

  visitDate = (index: number): PageElement => cy.get(`[data-test=visit-date-${index}]`)

  visitStartEndTime = (index: number): PageElement => cy.get(`[data-test=visit-start-end-time-${index}]`)

  visitLink = (index: number): PageElement => cy.get(`[data-test=visit-link-${index}]`)
}
