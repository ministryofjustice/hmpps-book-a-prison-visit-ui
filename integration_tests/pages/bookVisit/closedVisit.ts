import Page from '../page'

export default class ClosedVisitPage extends Page {
  constructor() {
    super('This will be a closed visit')
  }

  continue = (): void => {
    cy.get('[data-test=closed-visit-continue]').click()
  }
}
