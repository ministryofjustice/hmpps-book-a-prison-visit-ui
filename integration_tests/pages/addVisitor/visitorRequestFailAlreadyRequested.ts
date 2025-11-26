import Page, { PageElement } from '../page'

export default class VisitorRequestFailAlreadyRequestedPage extends Page {
  constructor() {
    super('Visitor already requested')
  }

  getVisitorName = (): PageElement => cy.get('[data-test=visitor-name]')
}
