import Page from '../page'

export default class PrisonerLocationPage extends Page {
  constructor() {
    super('Where is the prisoner you want to visit?')
  }

  selectPrison = (prisonId: string): void => {
    cy.get(`input[value=${prisonId}]`).check()
  }

  continue = (): void => {
    cy.get('[data-test="confirm-button"]').click()
  }
}
