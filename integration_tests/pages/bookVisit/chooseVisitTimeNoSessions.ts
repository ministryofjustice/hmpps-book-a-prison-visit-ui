import Page, { PageElement } from '../page'

export default class ChooseVisitTimeNoSessionsPage extends Page {
  constructor() {
    super('A visit cannot be booked')

    cy.contains('no available visit times')
  }

  prisonerName = (): PageElement => cy.get('[data-test=prisoner-name]')

  prisonWebsite = (): PageElement => cy.get('[data-test=prison-website]')
}
