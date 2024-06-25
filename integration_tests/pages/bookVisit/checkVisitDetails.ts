import Page, { PageElement } from '../page'

export default class CheckVisitDetailsPage extends Page {
  constructor() {
    super('Check the visit details before booking')
  }

  prisonerName = (): PageElement => cy.get('[data-test="prisoner-name"]')

  visitorName = (index: number): PageElement => cy.get(`[data-test="visitor-name-${index}"]`)

  visitDate = (): PageElement => cy.get('[data-test="visit-date"]')

  visitTime = (): PageElement => cy.get('[data-test="visit-time"]')

  additionalSupport = (): PageElement => cy.get('[data-test="additional-support"]')

  mainContactName = (): PageElement => cy.get('[data-test="main-contact-name"]')

  mainContactNumber = (): PageElement => cy.get('[data-test="main-contact-number"]')

  continue = (): void => this.clickDisabledOnSubmitButton('submit-booking')
}
