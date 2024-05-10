/* eslint-disable no-param-reassign */
import path from 'path'
import nunjucks from 'nunjucks'
import express from 'express'
import { formatDuration, intervalToDuration, isAfter } from 'date-fns'
import { formatDate, initialiseName } from './utils'
import { ApplicationInfo } from '../applicationInfo'
import config from '../config'

const production = process.env.NODE_ENV === 'production'

export default function nunjucksSetup(app: express.Express, applicationInfo: ApplicationInfo): nunjucks.Environment {
  app.set('view engine', 'njk')

  app.locals.asset_path = '/assets/'
  app.locals.applicationName = 'HMPPS Book a Prison Visit UI'
  app.locals.environmentName = config.environmentName
  app.locals.environmentNameColour = config.environmentName === 'PRE-PRODUCTION' ? 'govuk-tag--green' : ''
  app.locals.oneLoginLink = config.apis.govukOneLogin.homeUrl

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

  const njkEnv = nunjucks.configure([path.join(__dirname, '../../server/views'), 'node_modules/govuk-frontend/dist/'], {
    autoescape: true,
    express: app,
  })

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

  njkEnv.addFilter('formatDate', formatDate)

  njkEnv.addFilter('initialiseName', initialiseName)

  njkEnv.addFilter('pluralise', (word, count, plural = `${word}s`) => (count === 1 ? word : plural))

  return njkEnv
}
