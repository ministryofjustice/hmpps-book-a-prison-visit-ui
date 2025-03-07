import { Request } from 'express'
import { SessionData } from 'express-session'
import {
  clearSession,
  convertToTitleCase,
  formatDate,
  formatTime,
  formatTimeDuration,
  formatTimeFromDateTime,
  getMainContactName,
  initialiseName,
  isAdult,
  isMobilePhoneNumber,
  pluralise,
} from './utils'
import TestData from '../routes/testutils/testData'
import { Visitor } from '../services/bookerService'

describe('convert to title case', () => {
  it.each([
    [null, null, ''],
    ['empty string', '', ''],
    ['Lower case', 'robert', 'Robert'],
    ['Upper case', 'ROBERT', 'Robert'],
    ['Mixed case', 'RoBErT', 'Robert'],
    ['Multiple words', 'RobeRT SMiTH', 'Robert Smith'],
    ['Leading spaces', '  RobeRT', '  Robert'],
    ['Trailing spaces', 'RobeRT  ', 'Robert  '],
    ['Hyphenated', 'Robert-John SmiTH-jONes-WILSON', 'Robert-John Smith-Jones-Wilson'],
  ])('%s convertToTitleCase(%s, %s)', (_: string, a: string, expected: string) => {
    expect(convertToTitleCase(a)).toEqual(expected)
  })
})

describe('initialise name', () => {
  it.each([
    [null, null, null],
    ['Empty string', '', null],
    ['One word', 'robert', 'r. robert'],
    ['Two words', 'Robert James', 'R. James'],
    ['Three words', 'Robert James Smith', 'R. Smith'],
    ['Double barrelled', 'Robert-John Smith-Jones-Wilson', 'R. Smith-Jones-Wilson'],
  ])('%s initialiseName(%s, %s)', (_: string, a: string, expected: string) => {
    expect(initialiseName(a)).toEqual(expected)
  })
})

describe('formatDate', () => {
  it.each([
    ['Default format (date/time input)', '2022-02-14T10:00:00', undefined, '14 February 2022'],
    ['Default format (short date input)', '2022-02-14', undefined, '14 February 2022'],
    ['Custom format', '2022-02-14T10:00:00', 'yy MMM d', '22 Feb 14'],
    ['Invalid date', 'not a date', undefined, ''],
    ['Invalid format', '2022-02-14T10:00:00', '', ''],
  ])('%s formatDate(%s, %s) = %s', (_: string, date: string, format: string, expected: string) => {
    expect(formatDate(date, format)).toEqual(expected)
  })
})

describe('formatTime', () => {
  it.each([
    ['Morning time', '10:30', '10:30am'],
    ['Afternoon time', '14:30', '2:30pm'],
    ['Truncate whole hours', '09:00', '9am'],
    ['Invalid date', 'not a date', ''],
  ])('%s formatTime(%s) = %s', (_: string, date: string, expected: string) => {
    expect(formatTime(date)).toEqual(expected)
  })
})

describe('formatDateTime', () => {
  it.each([
    ['Morning date time', '2022-02-14T10:30', '10:30am'],
    ['Afternoon date time', '2022-02-14T14:30:00', '2:30pm'],
    ['Truncate whole hour', '2022-02-14T09:00:00', '9am'],
    ['Empty', '', null],
    ['Invalid date', 'not a date', ''],
  ])('%s formatTimeFromDateTime(%s) = %s', (_: string, date: string, expected: string) => {
    expect(formatTimeFromDateTime(date)).toEqual(expected)
  })
})

describe('formatTimeDuration', () => {
  it.each([
    ['Hours and minutes', '10:00', '11:30', '1 hour and 30 minutes'],
    ['Minutes only', '14:00', '14:45', '45 minutes'],
    ['Hours only', '11:00', '13:00', '2 hours'],
    ['Invalid times', 'not a time', undefined, ''],
  ])('%s formatTimeDuration(%s, %s) = %s', (_: string, startTime: string, endTime: string, expected: string) => {
    expect(formatTimeDuration(startTime, endTime)).toEqual(expected)
  })
})

describe('pluralise', () => {
  describe('Regular plurals', () => {
    it.each([
      ['should return plural form when count is 0', 'table', '0', 'tables'],
      ['should return singular form when count is 1', 'table', '1', 'table'],
      ['should return plural form when count is 2', 'table', '2', 'tables'],
    ])('%s pluralise(%s, %s) = %s', (_: string, word: string, count: string, expected: string) => {
      expect(pluralise(word, count)).toBe(expected)
    })
  })
  describe('Irregular plurals', () => {
    it.each([
      ['should return plural form when count is 0', 'child', '0', 'children', 'children'],
      ['should return singular form when count is 1', 'child', '1', 'children', 'child'],
      ['should return plural form when count is 2', 'child', '2', 'children', 'children'],
    ])('%s pluralise(%s, %s) = %s', (_: string, word: string, count: string, plural: string, expected: string) => {
      expect(pluralise(word, count, plural)).toBe(expected)
    })
  })

  describe('Check if adult', () => {
    it('Is an adult - now', () => {
      expect(isAdult('2000-01-01')).toEqual(true)
    })
    it('Is an adult - on given date', () => {
      expect(isAdult('2000-01-02', new Date('2018-01-02'))).toEqual(true)
    })
    it('Is a child - on given date', () => {
      expect(isAdult('2000-01-02', new Date('2018-01-01'))).toEqual(false)
    })
  })

  describe('Clear session data', () => {
    it('should clear booking journey from the session', () => {
      const sessionData: Partial<Record<keyof SessionData, string>> = {
        booker: 'BOOKER DATA',
        bookingJourney: 'BOOKING JOURNEY DATA',
        bookingConfirmed: 'BOOKING CONFIRMATION DATA',
      }
      const req = { session: sessionData } as unknown as Request

      clearSession(req)

      expect(sessionData).toStrictEqual({ booker: 'BOOKER DATA' })
    })
  })

  describe('getMainContactName', () => {
    const visitor1 = TestData.visitor({ firstName: 'User', lastName: 'One' })
    const visitor2 = 'User Two'

    it.each([
      ['should concatenate names when mainContact is a Visitor', visitor1, 'User One'],
      ['should use name when mainContact is a string', visitor2, 'User Two'],
      ['should handle mainContact being undefined', undefined, undefined],
    ])('%s', (_: string, visitor: Visitor | string, expectedName: string) => {
      expect(getMainContactName(visitor)).toBe(expectedName)
    })
  })

  describe('isMobilePhoneNumber', () => {
    it.each([
      ['non-mobile number', '01234567890', false],
      ['valid mobile number', '07712000000', true],
      ['valid mobile number (with spaces)', '07712 000 000', true],
      ['valid mobile number (with int. code)', '+447712 000000', true],
      ['empty string', '', false],
      ['invalid string', 'not a number', false],
      ['undefined number', undefined, false],
    ])('%s - %s - %s', (_: string, number: string, expected: boolean) => {
      expect(isMobilePhoneNumber(number)).toBe(expected)
    })
  })
})
