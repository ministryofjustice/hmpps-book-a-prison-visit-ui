import Page, { PageElement } from './page'

export default class ServiceStartPage extends Page {
  constructor() {
    super('Visit someone in prison')
  }

  getSupportedPrison = (index: number): PageElement => cy.get(`[data-test^="prison-${index}"]`)

  startNow = (): void => {
    cy.get('[data-test="start-now"]').click()
  }
}
