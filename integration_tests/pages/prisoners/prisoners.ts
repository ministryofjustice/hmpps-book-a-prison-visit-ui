import Page, { PageElement } from '../page'

export default class PrisonersPage extends Page {
  constructor() {
    super('Prisoners and Visitors')
  }

  prisonerName = (index: number): PageElement => cy.get(`[data-test="prisoner-name-${index}"]`)

  prisonerDateOfBirth = (index: number): PageElement => cy.get(`[data-test="prisoner-dob-${index}"]`)

  addANewPrisoner = (): void => {
    cy.get('[data-test="link-new-prisoner-button"]').click()
  }
}
