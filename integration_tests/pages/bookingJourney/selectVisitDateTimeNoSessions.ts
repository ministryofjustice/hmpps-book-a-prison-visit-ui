import Page from '../page'

export default class SelectVisitDateTimeNoSessionsPage extends Page {
  constructor() {
    super('A visit cannot be booked')

    cy.contains('no available visit times')
  }

  returnToHome = (): void => {
    cy.get('[data-test="return-to-home"]').click()
  }
}
