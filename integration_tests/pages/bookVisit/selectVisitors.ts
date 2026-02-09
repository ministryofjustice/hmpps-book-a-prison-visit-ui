import Page, { PageElement } from '../page'

export default class SelectVisitorsPage extends Page {
  constructor() {
    super('Who is going on the visit?')
  }

  // Visitor totals / age
  visitorsMaxTotal = (): PageElement => cy.get('[data-test=visitors-max-total]')

  prisonName = (): PageElement => cy.get('[data-test=prison-name]')

  visitorsMaxAdults = (): PageElement => cy.get('[data-test=visitors-max-adults]')

  visitorsMaxChildren = (): PageElement => cy.get('[data-test=visitors-max-children]')

  visitorsAdultAge = (): PageElement => cy.get('[data-test=visitors-adult-age]')

  // Visitor list
  getVisitorByNameLabel = (name: string): PageElement => cy.get('input[name=visitorDisplayIds] + label').contains(name)

  selectVisitorByName = (name: string): void => {
    cy.get('label').contains(name).siblings('input[name=visitorDisplayIds]').check()
  }

  // Unavailable visitors
  bannedVisitor = (index: number): PageElement => cy.get(`[data-test="banned-visitor-${index}"]`)

  bannedVisitorExpiryDate = (index: number): PageElement => cy.get(`[data-test="ban-expiry-${index}"]`)

  notApprovedVisitor = (index: number): PageElement => cy.get(`[data-test="not-approved-visitor-${index}"]`)

  // Visitor requests
  visitorRequest = (index: number): PageElement => cy.get(`[data-test=visitor-request-${index}]`)

  continue = (): void => {
    cy.get('[data-test="continue-button"]').click()
  }
}
