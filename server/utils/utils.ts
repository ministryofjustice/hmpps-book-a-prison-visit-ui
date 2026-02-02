import { Request } from 'express'
import { differenceInYears, format, formatDuration, intervalToDuration, parse, parseISO } from 'date-fns'
import { SessionData } from 'express-session'
// eslint-disable-next-line import/no-named-as-default
import parsePhoneNumber from 'libphonenumber-js/mobile'
import type { Visitor } from '../services/bookerService'

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

export const formatDate = (date: string, dateFormat = 'd MMMM yyyy'): string => {
  try {
    return format(parseISO(date), dateFormat)
  } catch {
    return ''
  }
}

export const formatTime = (time: string): string => {
  try {
    const referenceDate = new Date()
    const parsedTime = parse(time, 'HH:mm', referenceDate)
    return format(parsedTime, 'h:mmaaa').replace(':00', '')
  } catch {
    return ''
  }
}

export const formatTimeFromDateTime = (dateTime: string): string => {
  try {
    return dateTime ? format(parseISO(dateTime), 'h:mmaaa').replace(':00', '') : null
  } catch {
    return ''
  }
}

export const formatTimeDuration = (startTime: string, endTime: string): string => {
  try {
    const referenceDate = new Date()
    const start = parse(startTime, 'HH:mm', referenceDate)
    const end = parse(endTime, 'HH:mm', referenceDate)

    const duration = intervalToDuration({ start, end })

    return formatDuration(duration, { delimiter: ' and ' })
  } catch {
    return ''
  }
}

export const pluralise = (word: string, count: string | number, plural = `${word}s`): string => {
  return parseInt(count.toString(), 10) === 1 ? word : plural
}

export const isAdult = (dateOfBirth: string, referenceDate: Date = new Date()): boolean => {
  const dobDate = parseISO(dateOfBirth)
  return differenceInYears(referenceDate, dobDate) >= 18
}

export const clearSession = (req: Request): void => {
  ;['addPrisonerJourney', 'bookVisitJourney', 'bookVisitConfirmed'].forEach((sessionItem: keyof SessionData) => {
    delete req.session[sessionItem]
  })
}

export const getMainContactName = (mainContact: Visitor | string): string => {
  if (mainContact) {
    return typeof mainContact === 'string' ? mainContact : `${mainContact.firstName} ${mainContact.lastName}`
  }
  return undefined
}

export const isMobilePhoneNumber = (phoneNumber: string): boolean => {
  return parsePhoneNumber(phoneNumber ?? '', 'GB')?.getType() === 'MOBILE'
}
