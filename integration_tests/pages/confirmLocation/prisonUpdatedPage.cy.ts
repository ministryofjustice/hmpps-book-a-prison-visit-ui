import Page from '../page'

export default class PrisonUpdatedPage extends Page {
  constructor(private readonly prison: string) {
    super(`John is at ${prison}`)
  }

  continue = (): void => {
    cy.get('[data-test=continue]').click()
  }
}
