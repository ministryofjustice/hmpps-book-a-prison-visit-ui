import Page, { PageElement } from '../page'

export default class VisitDetailsPage extends Page {
  constructor() {
    super('Visit details')
  }

  visitReference = (): PageElement => cy.get('[data-test="visit-reference"]')

  visitDate = (): PageElement => cy.get('[data-test="visit-date"]')

  visitStartEndTime = (): PageElement => cy.get('[data-test="visit-start-end-time"]')

  prisonerName = (): PageElement => cy.get('[data-test="prisoner-name"]')

  visitorName = (index: number): PageElement => cy.get(`[data-test=visitor-name-${index}]`)

  additionalSupport = (): PageElement => cy.get('[data-test="additional-support"]')

  mainContactName = (): PageElement => cy.get('[data-test="main-contact-name"]')

  mainContactEmail = (): PageElement => cy.get('[data-test="main-contact-email"]')

  mainContactNumber = (): PageElement => cy.get('[data-test="main-contact-number"]')

  contactPrison = (): PageElement => cy.get('[data-test="contact-prison"]')

  cancelVisitButton = (): PageElement => cy.get(`[data-test=cancel-visit]`)
}
