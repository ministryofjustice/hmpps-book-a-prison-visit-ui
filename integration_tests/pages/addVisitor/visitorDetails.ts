import Page from '../page'

export default class VisitorDetailsPage extends Page {
  constructor() {
    super('Visitor information')
  }

  enterFirstName = (firstName: string): void => {
    cy.get('#firstName').type(firstName)
  }

  enterLastName = (lastName: string): void => {
    cy.get('#lastName').clear()
    cy.get('#lastName').type(lastName)
  }

  enterVisitorDob = (day: number, month: number, year: number): void => {
    cy.get('#visitorDob-day').type(day.toString())
    cy.get('#visitorDob-month').type(month.toString())
    cy.get('#visitorDob-year').type(year.toString())
  }

  continue = (): void => {
    cy.get('[data-test="continue-button"]').click()
  }
}
