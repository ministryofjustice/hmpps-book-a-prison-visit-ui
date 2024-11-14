import Page, { PageElement } from '../page'

export default class VisitorsPage extends Page {
  constructor() {
    super('Visitors')
  }

  prisonerName = (): PageElement => cy.get('[data-test=prisoner-name]')

  visitorName = (index: number): PageElement => cy.get(`[data-test=visitor-name-${index}]`)

  visitorDateOfBirth = (index: number): PageElement => cy.get(`[data-test=visitor-dob-${index}]`)
}
