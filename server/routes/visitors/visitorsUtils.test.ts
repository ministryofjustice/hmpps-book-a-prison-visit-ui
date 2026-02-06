import { GOVUKTableRow } from '../../@types/bapv'
import TestData from '../testutils/testData'
import { buildVisitorRequestsTableRows, buildVisitorsTableRows } from './visitorsUtils'

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
      // Not approved
      TestData.visitor({
        firstName: 'Visitor',
        lastName: 'Four',
        dateOfBirth: '2000-08-04',
        banned: false,
        approved: false,
      }),
      // Ban with an expiry date and not approved - ban priority
      TestData.visitor({
        firstName: 'Visitor',
        lastName: 'Five',
        dateOfBirth: '2000-08-05',
        banned: true,
        banExpiryDate: '2025-09-02',
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
        { text: 'No, banned', classes: 'warning', attributes: { 'data-test': 'visitor-availability-1' } },
      ],
      [
        { text: 'Visitor Three', attributes: { 'data-test': 'visitor-name-2' } },
        { text: '3 August 2000', attributes: { 'data-test': 'visitor-dob-2' } },
        {
          text: 'No, banned until 1 September 2025',
          classes: 'warning',
          attributes: { 'data-test': 'visitor-availability-2' },
        },
      ],
      [
        { text: 'Visitor Four', attributes: { 'data-test': 'visitor-name-3' } },
        { text: '4 August 2000', attributes: { 'data-test': 'visitor-dob-3' } },
        {
          text: 'No, visitor not approved',
          classes: 'warning',
          attributes: { 'data-test': 'visitor-availability-3' },
        },
      ],
      [
        { text: 'Visitor Five', attributes: { 'data-test': 'visitor-name-4' } },
        { text: '5 August 2000', attributes: { 'data-test': 'visitor-dob-4' } },
        {
          text: 'No, banned until 2 September 2025',
          classes: 'warning',
          attributes: { 'data-test': 'visitor-availability-4' },
        },
      ],
    ]

    expect(buildVisitorsTableRows(visitors)).toStrictEqual(expectedTableRows)
  })
})

describe('buildVisitorRequestsTableRows', () => {
  it('should build visitor requests table rows for visitors listing page', () => {
    const visitorRequests = [TestData.visitorRequest()]

    const expectedTableRows: GOVUKTableRow[] = [
      [
        { text: 'Joan Phillips', attributes: { 'data-test': 'visitor-request-name-0' } },
        { text: '21 February 1980', attributes: { 'data-test': 'visitor-request-dob-0' } },
      ],
    ]

    expect(buildVisitorRequestsTableRows(visitorRequests)).toStrictEqual(expectedTableRows)
  })
})
