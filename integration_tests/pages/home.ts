import Page, { PageElement } from './page'

export default class HomePage extends Page {
  constructor() {
    super('Book a visit')
  }

  prisonerName = (): PageElement => cy.get('[data-test=prisoner-name]')

  noPrisoner = (): PageElement => cy.get('[data-test="no-prisoner"]')

  start = (): void => {
    cy.get('[data-test="start"]').click()
  }

  addPrisoner = (): void => {
    cy.get('[data-test="add-prisoner"]').click()
  }
}
