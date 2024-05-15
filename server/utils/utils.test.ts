import { convertToTitleCase, formatDate, initialiseName, pluralise } from './utils'

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

describe('format a date', () => {
  it.each([
    ['Default format (date/time input)', '2022-02-14T10:00:00', undefined, '14 February 2022'],
    ['Default format (short date input)', '2022-02-14', undefined, '14 February 2022'],
    ['Custom format', '2022-02-14T10:00:00', 'yy MMM d', '22 Feb 14'],
    ['Invalid date', 'not a date', undefined, null],
    ['Invalid format', '2022-02-14T10:00:00', '', null],
  ])('%s formatDate(%s, %s) = %s', (_: string, date: string, format: string, expected: string) => {
    expect(formatDate(date, format)).toEqual(expected)
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
})
