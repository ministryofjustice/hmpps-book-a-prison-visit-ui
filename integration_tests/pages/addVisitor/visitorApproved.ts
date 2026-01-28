import Page, { PageElement } from '../page'

export default class VisitorApprovedPage extends Page {
  constructor() {
    super('Visitor linked')
  }

  visitorApprovedText = (): PageElement => cy.get('[data-test=visitor-approved]')
}
