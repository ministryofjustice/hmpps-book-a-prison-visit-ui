import { differenceInDays } from 'date-fns'
import { formatDate } from '../../utils/utils'
import type { Visitor } from '../../services/bookerService'

export const getVisitorAvailability = (
  restrictions: Visitor['visitorRestrictions'],
): { banned: boolean; expiryDate?: string } => {
  const bans = restrictions.filter(restriction => restriction.restrictionType === 'BAN')

  if (!bans.length) {
    return { banned: false }
  }
  const hasPermanentBan = bans.some(restriction => restriction.expiryDate === null)

  if (hasPermanentBan) {
    return { banned: true }
  }

  const expiryDates = bans
    .map(ban => ban.expiryDate)
    .sort()
    .reverse()

  return { banned: true, expiryDate: expiryDates[0] }
}

export const splitVisitorList = (
  visitors: Visitor[],
  policyNoticeDaysMax: number,
): { eligibleVisitors: Visitor[]; ineligibleVisitors: Visitor[] } => {
  const today = new Date()
  const allVisitors = visitors.map(visitor => {
    const restrictionStatus = getVisitorAvailability(visitor.visitorRestrictions)
    let eligible = false

    if (restrictionStatus.banned === false) {
      eligible = true
    } else if (restrictionStatus.banned && restrictionStatus.expiryDate === undefined) {
      eligible = false
    } else {
      const difference = differenceInDays(restrictionStatus.expiryDate, today)

      if (difference > policyNoticeDaysMax) {
        eligible = false
      } else {
        eligible = true
      }
    }

    return { ...visitor, eligible, banned: restrictionStatus.banned, banExpiryDate: restrictionStatus.expiryDate }
  })

  return {
    eligibleVisitors: allVisitors.filter(visitor => visitor.eligible),
    ineligibleVisitors: allVisitors.filter(visitor => !visitor.eligible),
  }
}

export const getVisitorAvailabilityDescription = (
  restrictions: Visitor['visitorRestrictions'],
): { text: string; class: string } => {
  const visitorAvailability = getVisitorAvailability(restrictions)
  if (visitorAvailability.banned === false) {
    return { text: 'Yes', class: '' }
  }
  if (visitorAvailability.expiryDate) {
    return { text: `Banned until ${formatDate(visitorAvailability.expiryDate)}`, class: 'warning' }
  }
  return { text: 'Banned', class: 'warning' }
}
