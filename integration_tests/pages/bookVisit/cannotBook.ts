import Page, { PageElement } from '../page'

export default class CannotBookPage extends Page {
  constructor() {
    super('A visit cannot be booked')

    cy.contains('has used their allowance of visits')
  }

  getPrisonerName = (): PageElement => cy.get('[data-test="prisoner-name"]')

  getBookFromDate = (): PageElement => cy.get('[data-test="book-from-date"]')
}
