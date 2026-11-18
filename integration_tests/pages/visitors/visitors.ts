import Page, { PageElement } from '../page'

export default class VisitorsPage extends Page {
  constructor(prisonerName: string) {
    super(`${prisonerName}’s visitors`)
  }

  visitorName = (index: number): PageElement => cy.get(`[data-test=visitor-name-${index}]`)

  visitorDateOfBirth = (index: number): PageElement => cy.get(`[data-test=visitor-dob-${index}]`)

  visitorAvailability = (index: number): PageElement => cy.get(`[data-test=visitor-availability-${index}]`)

  visitorRequests = (): PageElement => cy.get('[data-test=visitor-requests]')

  visitorRequestName = (index: number): PageElement => cy.get(`[data-test=visitor-request-name-${index}]`)

  visitorRequestDateOfBirth = (index: number): PageElement => cy.get(`[data-test=visitor-request-dob-${index}]`)

  cancelAVisitor = (index: number): void => {
    cy.get(`[data-test=visitor-request-cancel-${index}] > a`).click()
  }

  linkANewVisitor = (): void => {
    cy.get('[data-test=link-a-visitor]').click()
  }
}
