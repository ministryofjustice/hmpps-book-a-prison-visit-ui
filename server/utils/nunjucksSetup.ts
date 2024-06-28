/* eslint-disable no-param-reassign */
import path from 'path'
import nunjucks from 'nunjucks'
import express from 'express'
import { formatDuration, intervalToDuration, isAfter } from 'date-fns'
import { FieldValidationError } from 'express-validator'
import { formatDate, formatTime, formatTimeDuration, formatTimeFromDateTime, initialiseName, pluralise } from './utils'
import { ApplicationInfo } from '../applicationInfo'
import config from '../config'
import paths from '../constants/paths'
import { DateFormats } from '../constants/dateFormats'

const production = process.env.NODE_ENV === 'production'

export default function nunjucksSetup(app: express.Express, applicationInfo: ApplicationInfo): nunjucks.Environment {
  app.set('view engine', 'njk')

  app.locals.asset_path = '/assets/'
  app.locals.applicationName = 'Visit someone in prison'
  app.locals.environmentName = config.environmentName
  app.locals.showExtraTestAttrs = ['DEV', 'STAGING'].includes(config.environmentName)
  app.locals.oneLoginLink = config.apis.govukOneLogin.homeUrl
  app.locals.paths = paths
  app.locals.dateFormats = DateFormats
  app.locals.googleAnalyticsId = config.analytics.googleAnalyticsId

  // Cachebusting version string
  if (production) {
    // Version only changes with new commits
    app.locals.version = applicationInfo.gitShortHash
  } else {
    // Version changes every request
    app.use((req, res, next) => {
      res.locals.version = Date.now().toString()
      return next()
    })
  }

  const njkEnv = nunjucks.configure(
    [
      path.join(__dirname, '../../server/views'),
      'node_modules/govuk-frontend/dist/',
      'node_modules/@ministryofjustice/frontend/',
    ],
    {
      autoescape: true,
      express: app,
    },
  )

  njkEnv.addFilter('displayAge', (dateOfBirth: string) => {
    const dob = new Date(dateOfBirth)
    const today = new Date()

    if (dob.toString() === 'Invalid Date' || isAfter(dob, today)) {
      return ''
    }

    const duration = intervalToDuration({ start: dob, end: today })

    let age = ''
    if (duration.years) {
      age = formatDuration(duration, { format: ['years'] })
    } else {
      // workaround below for Duration zero/undefined change (https://github.com/date-fns/date-fns/issues/3658)
      age = formatDuration(duration, { format: ['months'] }) || '0 months'
    }

    return `${age} old`
  })

  // convert errors to format for GOV.UK error summary component
  njkEnv.addFilter('errorSummaryList', (errors = []) => {
    return Object.keys(errors).map(error => {
      return {
        text: errors[error].msg,
        href: errors[error].path ? `#${errors[error].path}-error` : undefined,
      }
    })
  })

  // find specific error and return errorMessage for field validation
  njkEnv.addFilter('findError', (errors: FieldValidationError[], formFieldId) => {
    if (!errors || !formFieldId) return null
    const errorForMessage = errors.find(error => error.path === formFieldId)

    if (errorForMessage === undefined) return null

    return {
      text: errorForMessage?.msg,
    }
  })

  njkEnv.addFilter('formatDate', formatDate)

  njkEnv.addFilter('formatTime', formatTime)

  njkEnv.addFilter('formatTimeFromDateTime', formatTimeFromDateTime)

  njkEnv.addFilter('formatTimeDuration', formatTimeDuration)

  njkEnv.addFilter('initialiseName', initialiseName)

  njkEnv.addFilter('pluralise', pluralise)

  return njkEnv
}
