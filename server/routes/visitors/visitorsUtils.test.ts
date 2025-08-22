import { GOVUKTableRow } from '../../@types/bapv'
import TestData from '../testutils/testData'
import { buildVisitorsTableRows } from './visitorsUtils'

describe('buildVisitorsTableRows', () => {
  it('should build visitor table rows for visitors listing page', () => {
    const visitors = [
      // No ban
      TestData.visitor({ firstName: 'Visitor', lastName: 'One', dateOfBirth: '2000-08-01', banned: false }),
      // Indefinite ban
      TestData.visitor({ firstName: 'Visitor', lastName: 'Two', dateOfBirth: '2000-08-02', banned: true }),
      // Ban with an expiry date
      TestData.visitor({
        firstName: 'Visitor',
        lastName: 'Three',
        dateOfBirth: '2000-08-03',
        banned: true,
        banExpiryDate: '2025-09-01',
      }),
    ]

    const expectedTableRows: GOVUKTableRow[] = [
      [
        { text: 'Visitor One', attributes: { 'data-test': 'visitor-name-0' } },
        { text: '1 August 2000', attributes: { 'data-test': 'visitor-dob-0' } },
        { text: 'Yes', classes: '', attributes: { 'data-test': 'visitor-availability-0' } },
      ],
      [
        { text: 'Visitor Two', attributes: { 'data-test': 'visitor-name-1' } },
        { text: '2 August 2000', attributes: { 'data-test': 'visitor-dob-1' } },
        { text: 'Banned', classes: 'warning', attributes: { 'data-test': 'visitor-availability-1' } },
      ],
      [
        { text: 'Visitor Three', attributes: { 'data-test': 'visitor-name-2' } },
        { text: '3 August 2000', attributes: { 'data-test': 'visitor-dob-2' } },
        {
          text: 'Banned until 1 September 2025',
          classes: 'warning',
          attributes: { 'data-test': 'visitor-availability-2' },
        },
      ],
    ]

    expect(buildVisitorsTableRows(visitors)).toStrictEqual(expectedTableRows)
  })
})
