import Page, { PageElement } from '../page'

export default class ChooseVisitTimePage extends Page {
  constructor() {
    super('Choose the visit time')
  }

  clickCalendarDay = (date: string): void => {
    cy.get(`#day-link-${date}`).click()
  }

  getSessionLabel = (date: string, index: number): PageElement =>
    cy.get(`#day-group-${date} input`).eq(index).siblings('label')

  selectSession = (date: string, index: number): void => {
    cy.get(`#day-group-${date} input`).eq(index).click()
  }

  continue = (): void => this.clickDisabledOnSubmitButton('continue-button')
}
