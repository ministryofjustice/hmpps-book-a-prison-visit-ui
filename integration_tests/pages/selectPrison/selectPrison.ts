import Page from '../page'

export default class SelectPrisonPage extends Page {
  constructor() {
    super('Which prison are you visiting?')
  }

  autoCompletePrisonName = (startChars: string, expectedMatch: string): void => {
    // enter initial characters to autocomplete input
    cy.get('#prisonId').type(startChars)
    // keypresses to choose match that should be found
    cy.get('#prisonId').type('{downArrow}{enter}')
    // check match
    cy.get('#prisonId').should('have.value', expectedMatch)
  }

  continue = (): void => {
    cy.get('[data-test="continue-button"]').click()
  }
}
