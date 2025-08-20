import Page, { PageElement } from '../../page'

export default class CancelVisitPage extends Page {
  constructor() {
    super('Are you sure you want to cancel your visit?')
  }

  visitDate = (): PageElement => cy.get(`[data-test=visit-date]`)

  visitStartTime = (): PageElement => cy.get(`[data-test=visit-start-time`)

  visitEndTime = (): PageElement => cy.get(`[data-test=visit-end-time`)

  prisonerName = (): PageElement => cy.get(`[data-test=prisoner-name`)

  visitorName = (index: number): PageElement => cy.get(`[data-test=visitor-name-${index}]`)

  cancelBookingNo = (): PageElement => cy.get(`[data-test=cancel-booking-no`)

  cancelBookingYes = (): PageElement => cy.get(`[data-test=cancel-booking-yes`)

  confirmButton = (): void => {
    cy.get('[data-test="confirm-button"]').click()
  }
}
