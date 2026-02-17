import Page, { PageElement } from '../page'

export default class VisitsPage extends Page {
  constructor() {
    super('Visits')
  }

  visitDate = (index: number): PageElement => cy.get(`[data-test=visit-date-${index}]`)

  visitStartTime = (index: number): PageElement => cy.get(`[data-test=visit-start-time-${index}]`)

  visitEndTime = (index: number): PageElement => cy.get(`[data-test=visit-end-time-${index}]`)

  visitReference = (index: number): PageElement => cy.get(`[data-test=visit-reference-${index}]`)

  visitLink = (index: number): PageElement => cy.get(`[data-test=visit-link-${index}]`)

  pastVisitsLink = (): PageElement => cy.get('[data-test="past-visits-link"]')

  cancelledVisitsLink = (): PageElement => cy.get('[data-test="cancelled-visits-link"]')
}
