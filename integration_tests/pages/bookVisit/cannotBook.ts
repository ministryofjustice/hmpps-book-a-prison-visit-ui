import Page, { PageElement } from '../page'

export default class CannotBookPage extends Page {
  constructor() {
    super('A visit cannot be booked')
  }

  getPrisonerName = (): PageElement => cy.get('[data-test="prisoner-name"]')

  // NO_VO_BALANCE
  getBookFromDate = (): PageElement => cy.get('[data-test="book-from-date"]')

  // TRANSFER_OR_RELEASE
  getPrisonName = (): PageElement => cy.get('[data-test="prison-name"]')
}
