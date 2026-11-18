import Page, { PageElement } from '../page'

export default class UnsupportedPrisonPage extends Page {
  constructor(private readonly prison: string) {
    super(`You cannot book visits to ${prison} using this service`)
  }

  prisonDirectoryLink = (): PageElement => cy.get('[data-test="prison-directory-link"] > a')

  continueButton = (): void => {
    cy.get('[data-test=continue-button]').click()
  }
}
