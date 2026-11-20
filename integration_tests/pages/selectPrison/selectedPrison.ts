import Page, { PageElement } from '../page'

export default class SelectedPrisonPage extends Page {
  constructor(private readonly prisonName: string) {
    super(`Visiting ${prisonName}`)
  }

  noDigitalService = (): PageElement => cy.get('[data-test="no-digital-service"]')
}
