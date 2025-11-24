import Page from '../page'

export default class AddVisitorStartPage extends Page {
  constructor() {
    super('Providing visitor information')
  }

  continue = (): void => {
    cy.get('[data-test="continue-button"]').click()
  }
}
