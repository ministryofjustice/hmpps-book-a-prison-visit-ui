import { Visitor } from '../../services/bookerService'
import TestData from '../testutils/testData'
import { getVisitorAvailability, getVisitorAvailabilityDescription, splitVisitorList } from './visitorsUtils'

describe('getVisitorAvailability', () => {
  it.each([
    ['No banned visitor', [], { banned: false }],
    [
      'Banned visitor, no expiry',
      [{ restrictionType: 'BAN', expiryDate: null }] as Visitor['visitorRestrictions'], // permanent
      { banned: true },
    ],
    [
      'Banned visitors, with expiry',
      [
        { restrictionType: 'BAN', expiryDate: '2029-01-01' }, // 2029
        { restrictionType: 'BAN', expiryDate: '2030-01-01' }, // 2030
      ] as Visitor['visitorRestrictions'],
      { banned: true, expiryDate: '2030-01-01' },
    ],
    [
      'Banned visitors (duplicate, reversed order), with expiry',
      [
        { restrictionType: 'BAN', expiryDate: '2030-01-01' }, // 2030
        { restrictionType: 'BAN', expiryDate: '2025-01-01' }, // 2029
      ] as Visitor['visitorRestrictions'],
      { banned: true, expiryDate: '2030-01-01' },
    ],
    [
      'Banned visitors, one with expiry, one without',
      [
        { restrictionType: 'BAN', expiryDate: '2029-01-01' }, // 2029
        { restrictionType: 'BAN', expiryDate: null }, // permanent
      ] as Visitor['visitorRestrictions'],
      { banned: true },
    ],
    [
      'Banned visitors, one with expiry, one without (duplicate, reversed order)',
      [
        { restrictionType: 'BAN', expiryDate: null }, // permanent
        { restrictionType: 'BAN', expiryDate: '2029-01-01' }, // 2029
      ] as Visitor['visitorRestrictions'],
      { banned: true },
    ],
  ])(
    '%s - %s - %s',
    (_: string, restrictions: Visitor['visitorRestrictions'], expected: { banned: boolean; expiryDate?: string }) => {
      expect(getVisitorAvailability(restrictions)).toStrictEqual(expected)
    },
  )
})

describe('getVisitorAvailabilityDescription', () => {
  it.each([
    ['No banned visitor', [], { text: 'Yes', class: '' }],
    [
      'Banned visitor, no expiry',
      [{ restrictionType: 'BAN', expiryDate: null }] as Visitor['visitorRestrictions'], // permanent
      { text: 'Banned', class: 'warning' },
    ],
    [
      'Banned visitor, with expiry',
      [
        { restrictionType: 'BAN', expiryDate: '2030-01-01' }, // 2030
      ] as Visitor['visitorRestrictions'],
      { text: 'Banned until 1 January 2030', class: 'warning' },
    ],
  ])(
    '%s - %s - %s',
    (_: string, restrictions: Visitor['visitorRestrictions'], expected: { text: string; class: string }) => {
      expect(getVisitorAvailabilityDescription(restrictions)).toStrictEqual(expected)
    },
  )
})

describe('splitVisitorList', () => {
  const policyNoticeDaysMax = 30

  const visitor1 = TestData.visitor() // not banned
  const visitor2 = TestData.visitor({ visitorRestrictions: [{ restrictionType: 'BAN', expiryDate: '2025-01-14' }] }) // expiring ban (before max booking window)
  const visitor3 = TestData.visitor({ visitorRestrictions: [{ restrictionType: 'BAN' }] }) // permanently banned
  const visitor4 = TestData.visitor({ visitorRestrictions: [{ restrictionType: 'BAN', expiryDate: '2025-05-01' }] }) // expiring ban (after max booking window)

  const fakeDate = new Date('2025-01-01')

  beforeEach(() => {
    jest.useFakeTimers({ advanceTimers: true, now: fakeDate })
  })

  afterEach(() => {
    jest.resetAllMocks()
    jest.useRealTimers()
  })

  it('should return one eligible visitor [no ban]', async () => {
    const eligibleVisitors: Visitor[] = [{ ...visitor1, eligible: true, banned: false, banExpiryDate: undefined }]
    const ineligibleVisitors: Visitor[] = []

    const visitors = [visitor1]

    const expected = {
      eligibleVisitors,
      ineligibleVisitors,
    }
    const results = splitVisitorList(visitors, policyNoticeDaysMax)

    expect(results).toStrictEqual(expected)
  })

  it('should return one eligible visitor [expiring ban, within maxBookingWindow]', async () => {
    const eligibleVisitors: Visitor[] = [
      { ...visitor2, eligible: true, banned: true, banExpiryDate: visitor2.visitorRestrictions[0].expiryDate },
    ]
    const ineligibleVisitors: Visitor[] = []

    const visitors = [visitor2]

    const expected = {
      eligibleVisitors,
      ineligibleVisitors,
    }
    const results = splitVisitorList(visitors, policyNoticeDaysMax)

    expect(results).toStrictEqual(expected)
  })

  it('should return one ineligible visitor [permanent ban]', async () => {
    const eligibleVisitors: Visitor[] = []
    const ineligibleVisitors: Visitor[] = [{ ...visitor3, eligible: false, banned: true, banExpiryDate: undefined }]

    const visitors = [visitor3]

    const expected = {
      eligibleVisitors,
      ineligibleVisitors,
    }
    const results = splitVisitorList(visitors, policyNoticeDaysMax)

    expect(results).toStrictEqual(expected)
  })

  it('should return one ineligible visitor [expiring ban, after maxBookingWindow]', async () => {
    const eligibleVisitors: Visitor[] = []
    const ineligibleVisitors: Visitor[] = [
      { ...visitor4, banned: true, eligible: false, banExpiryDate: visitor4.visitorRestrictions[0].expiryDate },
    ]

    const visitors = [visitor4]

    const expected = {
      eligibleVisitors,
      ineligibleVisitors,
    }
    const results = splitVisitorList(visitors, policyNoticeDaysMax)

    expect(results).toStrictEqual(expected)
  })

  it('should correctly deal with all 4 visitor types', async () => {
    const eligibleVisitors: Visitor[] = [
      { ...visitor1, eligible: true, banned: false, banExpiryDate: undefined },
      { ...visitor2, eligible: true, banned: true, banExpiryDate: visitor2.visitorRestrictions[0].expiryDate },
    ]
    const ineligibleVisitors: Visitor[] = [
      { ...visitor3, eligible: false, banned: true, banExpiryDate: undefined },
      { ...visitor4, eligible: false, banned: true, banExpiryDate: visitor4.visitorRestrictions[0].expiryDate },
    ]
    const visitors = [visitor1, visitor2, visitor3, visitor4]
    const expected = {
      eligibleVisitors,
      ineligibleVisitors,
    }
    const results = splitVisitorList(visitors, policyNoticeDaysMax)

    expect(results).toStrictEqual(expected)
  })
})
