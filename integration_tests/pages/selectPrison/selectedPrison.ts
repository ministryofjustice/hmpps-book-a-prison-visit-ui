import Page from '../page'

export default class SelectedPrisonPage extends Page {
  constructor(private readonly prisonName: string) {
    super(`Visiting ${prisonName}`)
  }

  continue = (): void => {
    cy.get('[data-test="continue-button"]').click()
  }
}
