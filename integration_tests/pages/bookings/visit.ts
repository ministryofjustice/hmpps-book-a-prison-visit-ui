import Page, { PageElement } from '../page'

export default class VisitDetailsPage extends Page {
  constructor() {
    super('Visit booking details')
  }

  visitCancelledBanner = (): PageElement => cy.get('[data-test="visit-cancelled-type"]')

  bookingReference = (): PageElement => cy.get('[data-test="booking-reference"]')

  visitDate = (): PageElement => cy.get('[data-test="visit-date"]')

  visitStartTime = (): PageElement => cy.get('[data-test="visit-start-time"]')

  visitEndTime = (): PageElement => cy.get('[data-test="visit-end-time"]')

  prisonerName = (): PageElement => cy.get('[data-test="prisoner-name"]')

  visitorName = (index: number): PageElement => cy.get(`[data-test=visitor-name-${index}]`)

  additionalSupport = (): PageElement => cy.get('[data-test="additional-support"]')

  mainContactName = (): PageElement => cy.get('[data-test="main-contact-name"]')

  mainContactNumber = (): PageElement => cy.get('[data-test="main-contact-number"]')

  prisonName = (): PageElement => cy.get('[data-test="prison-name"]')

  prisonPhoneNumber = (): PageElement => cy.get('[data-test="prison-phone-number"]')

  cancelVisitButton = (): PageElement => cy.get(`[data-test=cancel-visit]`)
}
