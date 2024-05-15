import Page, { PageElement } from '../page'

export default class SelectVisitorsPage extends Page {
  constructor() {
    super('Who is going on the visit?')
  }

  // Visitor totals / age
  visitorsMaxTotal = (): PageElement => cy.get('[data-test=visitors-max-total]')

  prisonName = (): PageElement => cy.get('[data-test=prison-name]')

  visitorsMaxAdults = (): PageElement => cy.get('[data-test=visitors-max-adults]')

  visitorsMaxChild = (): PageElement => cy.get('[data-test=visitors-max-child]')

  visitorsAdultAge = (): PageElement => cy.get('[data-test=visitors-adult-age]')

  // visitor list
  getVisitorLabel = (index: number): PageElement => cy.get('input[name=visitorIds] + label').eq(index)

  selectVisitor = (index: number): void => {
    cy.get('input[name=visitorIds]').eq(index).check()
  }

  continue = (): void => {
    cy.get('[data-test="continue-button"]').click()
  }
}
