import { Visitor } from '../../services/bookerService'
import { formatDate } from '../../utils/utils'

// eslint-disable-next-line import/prefer-default-export
export const getVisitorAvailability = (
  restrictions: Visitor['visitorRestrictions'],
): { text: string; class: string } => {
  const bans = restrictions.filter(restriction => restriction.restrictionType === 'BAN')
  if (!bans.length) {
    return { text: 'Yes', class: '' }
  }
  const hasPermanentBan = bans.some(restriction => restriction.expiryDate === null)

  if (hasPermanentBan) {
    return { text: 'Banned', class: 'warning' }
  }

  const expiryDates = bans
    .map(ban => ban.expiryDate)
    .sort()
    .reverse()

  return { text: `Banned until ${formatDate(expiryDates[0])}`, class: 'warning' }
}
