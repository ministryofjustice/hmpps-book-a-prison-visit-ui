import Page from '../page'

export default class PrisonerNotMatchedPage extends Page {
  constructor() {
    super('Prisoner details do not match')
  }

  goBackCheckDetails = (): void => {
    cy.get('[data-test="check-details"]').click()
  }
}
