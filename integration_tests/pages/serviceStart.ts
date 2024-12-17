import Page from './page'

export default class ServiceStartPage extends Page {
  constructor() {
    super('Visit someone in prison')
  }

  startNow = (): void => {
    cy.get('[data-test="start-now"]').click()
  }
}
