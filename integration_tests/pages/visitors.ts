import Page, { PageElement } from './page'

export default class VisitorsPage extends Page {
  constructor() {
    super('Visitors you can book for')
  }

  prisonerName = (): PageElement => cy.get('[data-test=prisoner-name]')

  visitorName = (index: number): PageElement => cy.get(`[data-test=visitor-name-${index}]`)

  visitorDateOfBirth = (index: number): PageElement => cy.get(`[data-test=visitor-date-of-birth-${index}]`)
}
