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
  getPrisonName,
  initialiseName,
  isAdult,
  isMobilePhoneNumber,
} from './utils'
import TestData from '../routes/testutils/testData'
import { Visitor } from '../services/bookerService'
import { PrisonNames } from '../services/prisonService'
import type { Locale } from '../constants/locales'
import { DateFormats } from '../constants/dateFormats'

describe('convert to title case', () => {
  it.each([
    ['null', null, ''],
    ['empty string', '', ''],
    ['Lower case', 'robert', 'Robert'],
    ['Upper case', 'ROBERT', 'Robert'],
    ['Mixed case', 'RoBErT', 'Robert'],
    ['Multiple words', 'RobeRT SMiTH', 'Robert Smith'],
    ['Leading spaces', '  RobeRT', '  Robert'],
    ['Trailing spaces', 'RobeRT  ', 'Robert  '],
    ['Hyphenated', 'Robert-John SmiTH-jONes-WILSON', 'Robert-John Smith-Jones-Wilson'],
  ])('%s convertToTitleCase(%s, %s)', (_: string, a: string | null, expected: string) => {
    expect(convertToTitleCase(a as string)).toEqual(expected)
  })
})

describe('initialise name', () => {
  it.each([
    ['null', null, null],
    ['Empty string', '', null],
    ['One word', 'robert', 'r. robert'],
    ['Two words', 'Robert James', 'R. James'],
    ['Three words', 'Robert James Smith', 'R. Smith'],
    ['Double barrelled', 'Robert-John Smith-Jones-Wilson', 'R. Smith-Jones-Wilson'],
  ])('%s initialiseName(%s, %s)', (_: string, a: string | null, expected: string | null) => {
    expect(initialiseName(a as string)).toEqual(expected)
  })
})

describe('formatDate', () => {
  it.each([
    ['Format date from date and time input', '2022-02-14T10:00:00', DateFormats.DISPLAY_DATE, '14 February 2022'],
    ['Format date from date input', '2022-02-14', DateFormats.DISPLAY_DATE, '14 February 2022'],
    ['Custom format', '2022-02-14T10:00:00', 'yy MMM d', '22 Feb 14'],
    ['Invalid date', 'not a date', DateFormats.DISPLAY_DATE, ''],
    ['Invalid format', '2022-02-14T10:00:00', '', ''],
  ])('%s formatDate(%s, %s) = %s', (_: string, date: string, format: string, expected: string) => {
    expect(formatDate(date, format, 'en')).toEqual(expected)
  })
})

describe('formatTime', () => {
  it.each([
    ['Morning time', '10:30', '10:30am'],
    ['Afternoon time', '14:30', '2:30pm'],
    ['Truncate whole hours', '09:00', '9am'],
    ['Invalid date', 'not a date', ''],
  ])('%s formatTime(%s) = %s', (_: string, date: string, expected: string) => {
    expect(formatTime(date, 'en')).toEqual(expected)
  })
})

describe('formatDateTime', () => {
  it.each([
    ['Morning date time', '2022-02-14T10:30', '10:30am'],
    ['Afternoon date time', '2022-02-14T14:30:00', '2:30pm'],
    ['Truncate whole hour', '2022-02-14T09:00:00', '9am'],
    ['Empty', '', ''],
    ['Invalid date', 'not a date', ''],
  ])('%s formatTimeFromDateTime(%s) = %s', (_: string, date: string, expected: string) => {
    expect(formatTimeFromDateTime(date, 'en')).toEqual(expected)
  })
})

describe('formatTimeDuration', () => {
  it.each([
    ['Hours and minutes', '10:00', '11:30', '1 hour 30 minutes'],
    ['Minutes only', '14:00', '14:45', '45 minutes'],
    ['Hours only', '11:00', '13:00', '2 hours'],
    ['Invalid times', 'not a time', undefined, ''],
  ])(
    '%s formatTimeDuration(%s, %s) = %s',
    (_: string, startTime: string, endTime: string | undefined, expected: string) => {
      expect(formatTimeDuration(startTime, endTime as string, 'en')).toEqual(expected)
    },
  )
})

describe('isAdult', () => {
  it.each([
    ['is an adult', '2000-01-01', new Date('2022-01-01'), true],
    ['is not an adult', '2010-01-01', new Date('2022-01-01'), false],
    ['is an adult on their 18th birthday', '2004-01-01', new Date('2022-01-01'), true],
    ['is not an adult one day before their 18th birthday', '2004-01-02', new Date('2022-01-01'), false],
    ['handles undefined date of birth', undefined, new Date('2022-01-01'), false],
  ])(
    '%s - isAdult(%s, %s) = %s',
    (_: string, dateOfBirth: string | undefined, referenceDate: Date, expected: boolean) => {
      expect(isAdult(dateOfBirth, referenceDate)).toBe(expected)
    },
  )
})

describe('Clear session data', () => {
  it('should clear booking and add prisoner journey data from the session', () => {
    const sessionData: Partial<Record<keyof SessionData, string>> = {
      booker: 'BOOKER DATA',
      addPrisonerJourney: 'ADD PRISONER JOURNEY DATA',
      bookVisitJourney: 'BOOK VISIT JOURNEY DATA',
      bookVisitConfirmed: 'BOOK VISIT CONFIRMATION DATA',
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
    ['should handle mainContact being undefined', undefined, ''],
  ])('%s', (_: string, visitor: Visitor | string | undefined, expectedName: string) => {
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
  ])('%s - %s - %s', (_: string, number: string | undefined, expected: boolean) => {
    expect(isMobilePhoneNumber(number)).toBe(expected)
  })
})

describe('getPrisonName', () => {
  const prisonNames: PrisonNames = {
    A: { name: { en: 'Prison A' } },
    B: { name: { en: 'Prison B', cy: 'Carchar B' } },
  }

  it.each([
    ['returns English name when language is English', 'A', prisonNames, 'en', 'Prison A'],
    ['returns Welsh name when language is Welsh', 'B', prisonNames, 'cy', 'Carchar B'],
    ['falls back to English name if Welsh name not available', 'A', prisonNames, 'cy', 'Prison A'],
    ['returns prison ID if prison is not found', 'C', prisonNames, 'en', 'C'],
  ] as const)('%s', (_: string, prisonId: string, names: PrisonNames, lng: Locale, expected: string) => {
    expect(getPrisonName(prisonId, names, lng)).toBe(expected)
  })
})
