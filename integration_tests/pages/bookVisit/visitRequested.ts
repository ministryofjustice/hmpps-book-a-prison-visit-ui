import Page, { PageElement } from '../page'

export default class VisitRequestedPage extends Page {
  constructor() {
    super('Visit requested')
  }

  requestReference = (): PageElement => cy.get('[data-test="request-reference"]')
}
