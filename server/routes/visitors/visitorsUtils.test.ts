import { Visitor } from '../../services/bookerService'
import { getVisitorAvailability } from './visitorsUtils'

describe('getVisitorAvailability', () => {
  it.each([
    ['No banned visitor', [], { text: 'Yes', class: '' }],
    [
      'Banned visitor, no expiry',
      [{ restrictionType: 'BAN', expiryDate: null }] as Visitor['visitorRestrictions'], // permanent
      { text: 'Banned', class: 'warning' },
    ],
    [
      'Banned visitors, with expiry',
      [
        { restrictionType: 'BAN', expiryDate: '2029-01-01' }, // 2029
        { restrictionType: 'BAN', expiryDate: '2030-01-01' }, // 2030
      ] as Visitor['visitorRestrictions'],
      { text: 'Banned until 1 January 2030', class: 'warning' },
    ],
    [
      'Banned visitors (duplicate, reversed order), with expiry',
      [
        { restrictionType: 'BAN', expiryDate: '2030-01-01' }, // 2030
        { restrictionType: 'BAN', expiryDate: '2025-01-01' }, // 2029
      ] as Visitor['visitorRestrictions'],
      { text: 'Banned until 1 January 2030', class: 'warning' },
    ],
    [
      'Banned visitors, one with expiry, one without',
      [
        { restrictionType: 'BAN', expiryDate: '2029-01-01' }, // 2029
        { restrictionType: 'BAN', expiryDate: null }, // permanent
      ] as Visitor['visitorRestrictions'],
      { text: 'Banned', class: 'warning' },
    ],
    [
      'Banned visitors, one with expiry, one without (duplicate, reversed order)',
      [
        { restrictionType: 'BAN', expiryDate: null }, // permanent
        { restrictionType: 'BAN', expiryDate: '2029-01-01' }, // 2029
      ] as Visitor['visitorRestrictions'],
      { text: 'Banned', class: 'warning' },
    ],
  ])(
    '%s - %s - %s',
    (_: string, restrictions: Visitor['visitorRestrictions'], expected: { text: string; class: string }) => {
      expect(getVisitorAvailability(restrictions)).toStrictEqual(expected)
    },
  )
})
