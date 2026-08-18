import Page, { PageElement } from '../page'

export default class VisitsPage extends Page {
  constructor() {
    super('Visits')
  }

  visitDate = (index: number): PageElement => cy.get(`[data-test=visit-date-${index}]`)

  visitStartEndTime = (index: number): PageElement => cy.get(`[data-test=visit-start-end-time-${index}]`)

  visitPrisonerName = (index: number): PageElement => cy.get(`[data-test="visit-prisoner-name-${index}"]`)

  visitPrisonName = (index: number): PageElement => cy.get(`[data-test="visit-prison-name-${index}"]`)

  visitReference = (index: number): PageElement => cy.get(`[data-test=visit-reference-${index}]`)

  visitLink = (index: number): PageElement => cy.get(`[data-test=visit-link-${index}]`)

  pastVisitsLink = (): PageElement => cy.get('[data-test="past-visits-link"]')

  cancelledVisitsLink = (): PageElement => cy.get('[data-test="cancelled-visits-link"]')

  bookVisit = (): void => {
    cy.get('[data-test=book-a-visit]').click()
  }

  addPrisoner = (): void => {
    cy.get('[data-test="add-prisoner"]').click()
  }

  noPrisoner = (): PageElement => cy.get('[data-test="no-prisoner"]')
}
