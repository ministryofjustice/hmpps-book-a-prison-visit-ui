import Page, { PageElement } from '../../page'

export default class CancelVisitPage extends Page {
  constructor() {
    super('Are you sure you want to cancel your visit?')
  }

  visitDate = (): PageElement => cy.get(`[data-test=visit-date]`)

  visitStartEndTime = (): PageElement => cy.get(`[data-test=visit-start-end-time`)

  prisonerName = (): PageElement => cy.get(`[data-test=prisoner-name`)

  visitorName = (index: number): PageElement => cy.get(`[data-test=visitor-name-${index}]`)

  cancelVisitNo = (): PageElement => cy.get(`[data-test=cancel-visit-no`)

  cancelVisitYes = (): PageElement => cy.get(`[data-test=cancel-visit-yes`)

  confirmButton = (): void => {
    cy.get('[data-test="confirm-button"]').click()
  }
}
