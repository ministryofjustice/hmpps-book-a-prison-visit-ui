import { TFunction } from 'i18next'
import { formatDate } from '../../utils/utils'
import type { Visitor } from '../../services/bookerService'
import { GOVUKTableRow } from '../../@types/bapv'
import { BookerPrisonerVisitorRequestDto } from '../../data/orchestrationApiTypes'
import type { Locale } from '../../constants/locales'
import { DateFormats } from '../../constants/dateFormats'

export const buildVisitorsTableRows = ({
  visitors,
  t,
  lng,
}: {
  visitors: Visitor[]
  t: TFunction
  lng: Locale
}): GOVUKTableRow[] => {
  return visitors.map((visitor, index) => {
    let visitorAvailabilityText = t('visitors:availability.canBook')
    if (visitor.banned) {
      visitorAvailabilityText = visitor.banExpiryDate
        ? t('visitors:availability.bannedUntil', {
            date: formatDate(visitor.banExpiryDate, DateFormats.DISPLAY_DATE, lng),
          })
        : t('visitors:availability.banned')
    } else if (!visitor.approved) {
      visitorAvailabilityText = t('visitors:availability.notApproved')
    }

    return [
      // Visitor name
      {
        text: `${visitor.firstName} ${visitor.lastName}`,
        attributes: { 'data-test': `visitor-name-${index}` },
      },
      // Visitor DoB
      {
        text: formatDate(visitor.dateOfBirth ?? '', DateFormats.DISPLAY_DATE, lng),
        attributes: { 'data-test': `visitor-dob-${index}` },
      },
      // Can you book for visitor?
      {
        text: visitorAvailabilityText,
        classes: visitor.banned || !visitor.approved ? 'warning' : '',
        attributes: { 'data-test': `visitor-availability-${index}` },
      },
    ]
  })
}

export const buildVisitorRequestsTableRows = ({
  visitors,
  lng,
}: {
  visitors: BookerPrisonerVisitorRequestDto[]
  lng: Locale
}): GOVUKTableRow[] => {
  return visitors.map((visitor, index) => {
    return [
      // Visitor name
      {
        text: `${visitor.firstName} ${visitor.lastName}`,
        attributes: { 'data-test': `visitor-request-name-${index}` },
      },
      // Visitor DoB
      {
        text: formatDate(visitor.dateOfBirth ?? '', DateFormats.DISPLAY_DATE, lng),
        attributes: { 'data-test': `visitor-request-dob-${index}` },
      },
    ]
  })
}
