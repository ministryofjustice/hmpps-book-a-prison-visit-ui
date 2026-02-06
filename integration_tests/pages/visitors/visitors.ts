import Page, { PageElement } from '../page'

export default class VisitorsPage extends Page {
  constructor() {
    super('Visitors')
  }

  prisonerName = (): PageElement => cy.get('[data-test=prisoner-name]')

  visitorName = (index: number): PageElement => cy.get(`[data-test=visitor-name-${index}]`)

  visitorDateOfBirth = (index: number): PageElement => cy.get(`[data-test=visitor-dob-${index}]`)

  visitorAvailability = (index: number): PageElement => cy.get(`[data-test=visitor-availability-${index}]`)

  visitorRequests = (): PageElement => cy.get('[data-test=visitor-requests]')

  visitorRequestName = (index: number): PageElement => cy.get(`[data-test=visitor-request-name-${index}]`)

  visitorRequestDateOfBirth = (index: number): PageElement => cy.get(`[data-test=visitor-request-dob-${index}]`)

  linkANewVisitor = (): void => {
    cy.get('[data-test=link-a-visitor]').click()
  }
}
