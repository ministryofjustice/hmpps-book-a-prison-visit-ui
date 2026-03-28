import Page, { PageElement } from '../page'

export default class SelectVisitorsPage extends Page {
  constructor() {
    super('Who is going on the visit?')
  }

  // Visitor totals / age
  maxVisitors = (): PageElement => cy.get('[data-test=max-visitors]')

  maxAdults = (): PageElement => cy.get('[data-test=max-adults]')

  maxChildren = (): PageElement => cy.get('[data-test=max-children]')

  // Visitor list
  getVisitorByNameLabel = (name: string): PageElement => cy.get('input[name=visitorDisplayIds] + label').contains(name)

  selectVisitorByName = (name: string): void => {
    cy.get('label').contains(name).siblings('input[name=visitorDisplayIds]').check()
  }

  // Unavailable visitors
  unavailableVisitor = (index: number): PageElement => cy.get(`[data-test="unavailable-visitor-${index}"]`)

  bannedVisitorExpiryDate = (index: number): PageElement => cy.get(`[data-test="ban-expiry-${index}"]`)

  // Visitor requests
  visitorRequest = (index: number): PageElement => cy.get(`[data-test=visitor-request-name-${index}]`)

  continue = (): void => {
    cy.get('[data-test="continue-button"]').click()
  }
}
