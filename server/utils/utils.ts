import { Request } from 'express'
import { differenceInYears, format, formatDuration, intervalToDuration, parse, parseISO } from 'date-fns'
import { parsePhoneNumberFromString as parsePhoneNumber } from 'libphonenumber-js/mobile'
import type { Visitor } from '../services/bookerService'
import { PrisonNames } from '../services/prisonService'
import { DATE_FNS_LOCALE, Locale } from '../constants/locales'

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

export const isAdult = (dateOfBirth: string | undefined, referenceDate: Date = new Date()): boolean => {
  if (!dateOfBirth) return false
  const dobDate = parseISO(dateOfBirth)
  return differenceInYears(referenceDate, dobDate) >= 18
}

export const clearSession = (req: Request): void => {
  ;(['addPrisonerJourney', 'bookVisitJourney', 'bookVisitConfirmed'] as const).forEach(sessionItem => {
    delete req.session[sessionItem]
  })
}

export const getMainContactName = (mainContact: Visitor | string = ''): string => {
  return typeof mainContact === 'string' ? mainContact : `${mainContact.firstName} ${mainContact.lastName}`
}

export const isMobilePhoneNumber = (phoneNumber: string | undefined): boolean => {
  return parsePhoneNumber(phoneNumber ?? '', 'GB')?.getType() === 'MOBILE'
}

export const getPrisonName = (prisonId: string, prisonNames: PrisonNames, lng: Locale): string => {
  const prison = prisonNames[prisonId]

  if (!prison) {
    return prisonId
  }

  return prison.name?.[lng] ?? prison.name.en
}
