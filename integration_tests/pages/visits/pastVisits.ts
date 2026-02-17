import Page, { PageElement } from '../page'

export default class PastVisitsPage extends Page {
  constructor() {
    super('Past visits')
  }

  visitDate = (index: number): PageElement => cy.get(`[data-test=visit-date-${index}]`)

  visitStartTime = (index: number): PageElement => cy.get(`[data-test=visit-start-time-${index}]`)

  visitEndTime = (index: number): PageElement => cy.get(`[data-test=visit-end-time-${index}]`)

  visitLink = (index: number): PageElement => cy.get(`[data-test=visit-link-${index}]`)
}
