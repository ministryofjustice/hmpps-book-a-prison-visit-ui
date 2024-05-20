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

  // visitor list
  getVisitorLabel = (personId: number): PageElement => cy.get(`input[name=visitorIds][value=${personId}] + label`)

  selectVisitor = (personId: number): void => {
    cy.get(`input[name=visitorIds][value=${personId}]`).check()
  }

  continue = (): void => {
    cy.get('[data-test="continue-button"]').click()
  }
}
