import Page, { PageElement } from '../page'

export default class ChooseVisitTimeNoSessionsPage extends Page {
  constructor() {
    super('A visit cannot be booked')

    cy.contains('no available visit times')
  }

  noSessionsPrisonerName = (): PageElement => cy.get('[data-test=no-sessions-for-prisoner]')

  prisonWebsite = (): PageElement => cy.get('[data-test=contact-prison] a')
}
