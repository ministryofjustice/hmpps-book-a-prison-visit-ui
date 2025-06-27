import Page, { PageElement } from '../page'

export default class CheckVisitDetailsPage extends Page {
  constructor() {
    super('Check the visit details')
  }

  prisonerName = (): PageElement => cy.get('[data-test="prisoner-name"]')

  prisonName = (): PageElement => cy.get('[data-test="prison-name"]')

  visitorName = (index: number): PageElement => cy.get(`[data-test="visitor-name-${index}"]`)

  visitDate = (): PageElement => cy.get('[data-test="visit-date"]')

  visitTime = (): PageElement => cy.get('[data-test="visit-time"]')

  additionalSupport = (): PageElement => cy.get('[data-test="additional-support"]')

  mainContactName = (): PageElement => cy.get('[data-test="main-contact-name"]')

  contactDetailsEmail = (): PageElement => cy.get('[data-test="contact-details-email"]')

  contactDetailsPhone = (): PageElement => cy.get('[data-test="contact-details-phone"]')

  submit = (): void => this.clickDisabledOnSubmitButton('submit')
}
