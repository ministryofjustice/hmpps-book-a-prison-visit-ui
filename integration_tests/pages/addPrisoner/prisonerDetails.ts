import Page from '../page'

export default class PrisonerDetailsPage extends Page {
  constructor() {
    super('Prisoner details')
  }

  enterFirstName = (firstName: string): void => {
    cy.get('#firstName').type(firstName)
  }

  enterLastName = (lastName: string): void => {
    cy.get('#lastName').clear()
    cy.get('#lastName').type(lastName)
  }

  enterPrisonerDob = (day: number, month: number, year: number): void => {
    cy.get('#prisonerDob-day').type(day.toString())
    cy.get('#prisonerDob-month').type(month.toString())
    cy.get('#prisonerDob-year').type(year.toString())
  }

  enterPrisonNumber = (prisonNumber: string): void => {
    cy.get('#prisonNumber').clear()
    cy.get('#prisonNumber').type(prisonNumber)
  }

  continue = (): void => {
    cy.get('[data-test="confirm-button"]').click()
  }
}
