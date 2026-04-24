import express from 'express'
import { FieldValidationError } from 'express-validator'
import nunjucksSetup from './nunjucksSetup'
import config from '../config'
import { ApplicationInfo } from '../applicationInfo'

describe('Nunjucks Filters', () => {
  const app = express()
  const njk = nunjucksSetup(app, {} as ApplicationInfo)

  describe('set show extra test attributes flag in DEV and STAGING', () => {
    it.each([
      ['', false],
      ['dev', true],
      ['staging', true],
      ['preprod', false],
      ['prod', false],
    ])(
      "when environmentName is '%s', showExtraTestAttrs should be %s",
      (environmentName: string, expected: boolean) => {
        const replacedProp = jest.replaceProperty(config, 'environmentName', environmentName)
        const appWithEnv = express()
        nunjucksSetup(appWithEnv, {} as ApplicationInfo)
        expect(appWithEnv.locals.showExtraTestAttrs).toBe(expected)
        replacedProp.replaceValue('environmentName')
      },
    )
  })

  describe('errorSummaryList', () => {
    it('should map errors to text and href', () => {
      const errors = <FieldValidationError[]>[
        { msg: 'Field 1 message', path: 'field1' },
        { msg: 'Field 2 message', path: 'field2' },
      ]
      const expectedResult = [
        { text: 'Field 1 message', href: '#field1' },
        { text: 'Field 2 message', href: '#field2' },
      ]

      const result = njk.getFilter('errorSummaryList')(errors)
      expect(result).toEqual(expectedResult)
    })

    it('should map error with no path to text with no href', () => {
      const errors = <FieldValidationError[]>[{ msg: 'Field 1 message with no path' }]
      const expectedResult = [{ text: 'Field 1 message with no path' }]

      const result = njk.getFilter('errorSummaryList')(errors)
      expect(result).toEqual(expectedResult)
    })

    it('should handle empty errors object', () => {
      const result = njk.getFilter('errorSummaryList')(undefined)
      expect(result).toEqual([])
    })
  })

  describe('findError', () => {
    it('should find specified error and return errorMessage for GDS components', () => {
      const errors = <FieldValidationError[]>[
        { msg: 'Field 1 message', path: 'field1' },
        { msg: 'Field 2 message', path: 'field2' },
      ]
      const expectedResult = { text: 'Field 2 message' }

      const result = njk.getFilter('findError')(errors, 'field2')
      expect(result).toEqual(expectedResult)
    })

    it('should handle empty errors object and missing form field', () => {
      const result = njk.getFilter('findError')(undefined)
      expect(result).toEqual(null)
    })
  })
})
