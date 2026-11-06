import Page from '../page'

export default class SelectPrisonerPage extends Page {
  constructor() {
    super('Who are you visiting?')
  }

  selectPrisonerByName = (name: string): void => {
    cy.get('label').contains(name).siblings('input[name=prisonerDisplayId]').check()
  }

  continue = (): void => {
    cy.get('[data-test="continue-button"]').click()
  }
}
