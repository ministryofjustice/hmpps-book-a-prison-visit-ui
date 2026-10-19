import { Request } from 'express'
import {
  differenceInYears,
  format,
  formatDuration,
  intervalToDuration,
  isAfter,
  isValid,
  parse,
  parseISO,
} from 'date-fns'
import { parsePhoneNumberFromString as parsePhoneNumber } from 'libphonenumber-js/mobile'
import nunjucks from 'nunjucks'
import type { TFunction } from 'i18next'
import type { Visitor } from '../services/bookerService'
import { PrisonNames } from '../services/prisonService'
import { DATE_FNS_LOCALE, Locale } from '../constants/locales'

const nunjucksEnvironment = new nunjucks.Environment()

const properCase = (word: string): string =>
  word.length >= 1 ? word[0].toUpperCase() + word.toLowerCase().slice(1) : word

const isBlank = (str: string): boolean => !str || /^\s*$/.test(str)

/**
 * Converts a name (first name, last name, middle name, etc.) to proper case equivalent, handling double-barrelled names
 * correctly (i.e. each part in a double-barrelled is converted to proper case).
 * @param name name to be converted.
 * @returns name converted to proper case.
 */
const properCaseName = (name: string): string => (isBlank(name) ? '' : name.split('-').map(properCase).join('-'))

export const convertToTitleCase = (sentence: string): string =>
  isBlank(sentence) ? '' : sentence.split(' ').map(properCaseName).join(' ')

export const initialiseName = (fullName?: string): string | null => {
  // this check is for the authError page
  if (!fullName) return null

  const array = fullName.split(' ')
  return `${array[0][0]}. ${array.reverse()[0]}`
}

export const displayAge = (dateOfBirth: string, t: TFunction): string => {
  const dob = new Date(dateOfBirth)
  const today = new Date()

  if (dob.toString() === 'Invalid Date' || isAfter(dob, today)) {
    return ''
  }

  const age = intervalToDuration({ start: dob, end: today })

  if (age?.years && age.years > 0) {
    return t('common:plurals.ageYears', { count: age.years })
  }

  return t('common:plurals.ageMonths', { count: age?.months ?? 0 })
}

export const formatDate = (date: string, dateFormat: string, lng: Locale): string => {
  try {
    return format(parseISO(date), dateFormat, { locale: DATE_FNS_LOCALE[lng] })
  } catch {
    return ''
  }
}

export const formatTime = (time: string, lng: Locale): string => {
  try {
    const referenceDate = new Date()
    const parsedTime = parse(time, 'HH:mm', referenceDate)
    return format(parsedTime, 'h:mmaaa', { locale: DATE_FNS_LOCALE[lng] }).replace(':00', '')
  } catch {
    return ''
  }
}

export const formatTimeFromDateTime = (dateTime: string, lng: Locale): string => {
  try {
    return dateTime ? format(parseISO(dateTime), 'h:mmaaa', { locale: DATE_FNS_LOCALE[lng] }).replace(':00', '') : ''
  } catch {
    return ''
  }
}

export const formatTimeDuration = (startTime: string, endTime: string, lng: Locale): string => {
  try {
    const referenceDate = new Date()
    const start = parse(startTime, 'HH:mm', referenceDate)
    const end = parse(endTime, 'HH:mm', referenceDate)

    const duration = intervalToDuration({ start, end })

    return formatDuration(duration, { locale: DATE_FNS_LOCALE[lng] })
  } catch {
    return ''
  }
}

/**
 * Calculates the age in years based on the provided date of birth.
 *
 * @param dateOfBirth date of birth string YYYY-MM-DD
 * @returns age in years or null if date of birth is invalid or not provided.
 */
export const ageInYears = (dateOfBirth: string | undefined | null): number | null => {
  if (!dateOfBirth) {
    return null
  }
  const parsedDateOfBirth = parseISO(dateOfBirth)
  return isValid(parsedDateOfBirth) ? differenceInYears(new Date(), parsedDateOfBirth) : null
}

export const getYoungestVisitorAge = (visitors: Visitor[]): number | null => {
  const visitorAges = visitors.map(visitor => visitor.age).filter((age): age is number => typeof age === 'number')

  if (visitorAges.length === 0) {
    return null
  }

  const youngestAge = Math.min(...visitorAges)
  return youngestAge
}

export const clearSession = (req: Request): void => {
  ;(
    [
      'addPrisonerJourney',
      'addPrisonerJourneyResult',
      'addVisitorJourney',
      'addVisitorJourneyResult',
      'bookVisitJourney',
      'bookVisitConfirmed',
      'bookedVisits',
      'visitCancelled',
    ] as const
  ).forEach(sessionItem => {
    delete req.session[sessionItem]
  })
}

export const getMainContactName = (mainContact: Visitor | string = ''): string => {
  return typeof mainContact === 'string' ? mainContact : `${mainContact.firstName} ${mainContact.lastName}`
}

export const isMobilePhoneNumber = (phoneNumber: string | null | undefined): boolean => {
  return parsePhoneNumber(phoneNumber ?? '', 'GB')?.getType() === 'MOBILE'
}

export const getPrisonName = (prisonId: string, prisonNames: PrisonNames, lng: Locale): string => {
  const prison = prisonNames[prisonId]

  if (!prison) {
    return prisonId
  }

  return prison.name?.[lng] ?? prison.name.en
}

export const escapeHtml = (value: string | undefined | null): string => {
  const escape = nunjucksEnvironment.getFilter('escape')
  return String(escape(value))
}

export const renderLinkTag = (
  text: string | undefined | null,
  url: string | undefined | null,
  openInNewTab = false,
): string => {
  if (!text) return ''

  if (!url) {
    return escapeHtml(text.replaceAll('<link>', '').replaceAll('</link>', ''))
  }

  const match = text.match(/<link>(.*?)<\/link>/s)
  if (!match || match.index === undefined) return escapeHtml(text)

  const escapedUrl = escapeHtml(url)
  const targetAttribute = openInNewTab ? ' target="_blank"' : ''
  const relAttribute = openInNewTab ? ' rel="noreferrer noopener"' : ''
  const fullMatch = match[0]
  const linkText = match[1]
  const before = escapeHtml(text.slice(0, match.index))
  const after = escapeHtml(text.slice(match.index + fullMatch.length))

  return `${before}<a href="${escapedUrl}"${targetAttribute}${relAttribute}>${escapeHtml(linkText)}</a>${after}`
}
