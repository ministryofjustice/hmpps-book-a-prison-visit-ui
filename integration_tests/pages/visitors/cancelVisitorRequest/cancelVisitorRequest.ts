import Page, { PageElement } from '../../page'

export default class CancelVisitorRequestPage extends Page {
  constructor() {
    super('Are you sure you want to cancel this request?')
  }

  visitorName = (): PageElement => cy.get(`[data-test=visitor-name]`)

  visitorDateOfBirth = (): PageElement => cy.get(`[data-test=visitor-date-of-birth]`)

  cancelVisitNo = (): PageElement => cy.get(`[data-test=cancel-visitor-no`)

  cancelVisitYes = (): PageElement => cy.get(`[data-test=cancel-visitor-yes`)

  confirmButton = (): void => {
    cy.get('[data-test="confirm-button"]').click()
  }
}
