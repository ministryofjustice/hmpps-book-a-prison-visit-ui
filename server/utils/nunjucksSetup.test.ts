import express from 'express'
import nunjucksSetup from './nunjucksSetup'

describe('Nunjucks Filters', () => {
  const app = express()
  const njk = nunjucksSetup(app, null)

  describe('displayAge', () => {
    beforeAll(() => {
      const fakeDate = new Date('2020-12-14T12:00:00')
      jest.useFakeTimers({ advanceTimers: true, now: new Date(fakeDate) })
    })
    afterAll(() => {
      jest.useRealTimers()
    })
    ;[
      { input: '3025-11-15', expected: '' }, // future date of birth
      { input: '2020-11-15', expected: '0 months old' },
      { input: '2020-11-14', expected: '1 month old' },
      { input: '2020-10-15', expected: '1 month old' },
      { input: '2020-10-14', expected: '2 months old' },
      { input: '2020-10-13', expected: '2 months old' },
      { input: '2019-12-15', expected: '11 months old' },
      { input: '2019-12-14', expected: '1 year old' },
      { input: '2018-12-15', expected: '1 year old' },
      { input: '2018-12-14', expected: '2 years old' },
      { input: '2017-12-15', expected: '2 years old' },
      { input: '2010-12-14', expected: '10 years old' },
      { input: '', expected: '' },
      { input: 'random string', expected: '' },
    ].forEach(testData => {
      it(`should output '${testData.expected}' when supplied with '${testData.input}'`, () => {
        const dateOfBirth = new Date(testData.input)
        const result = njk.getFilter('displayAge')(dateOfBirth)
        expect(result).toEqual(testData.expected)
      })
    })
  })

  describe('pluralise', () => {
    describe('Regular plurals', () => {
      it('should return plural form when count is 0', () => {
        const result = njk.getFilter('pluralise')('table', 0)
        expect(result).toEqual('tables')
      })

      it('should return singular form when count is 1', () => {
        const result = njk.getFilter('pluralise')('table', 1)
        expect(result).toEqual('table')
      })

      it('should return plural form when count is 2', () => {
        const result = njk.getFilter('pluralise')('table', 2)
        expect(result).toEqual('tables')
      })
    })

    describe('Irregular plurals', () => {
      it('should return plural form when count is 0', () => {
        const result = njk.getFilter('pluralise')('child', 0, 'children')
        expect(result).toEqual('children')
      })

      it('should return singular form when count is 1', () => {
        const result = njk.getFilter('pluralise')('child', 1, 'children')
        expect(result).toEqual('child')
      })

      it('should return plural form when count is 2', () => {
        const result = njk.getFilter('pluralise')('child', 2, 'children')
        expect(result).toEqual('children')
      })
    })
  })
})