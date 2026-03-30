import Page, { PageElement } from '../page'

export default class CannotBookPage extends Page {
  constructor() {
    super('A visit cannot be booked')
  }

  getCannotBookReason = (): PageElement => cy.get('[data-test="cannot-book-reason"]')

  getBookFromDate = (): PageElement => cy.get('[data-test="book-from-date"]')
}
