import { TFunction } from 'i18next'
import type { Prisoner } from '../../services/bookerService'
import { GOVUKTableRow } from '../../@types/bapv'
import type { Locale } from '../../constants/locales'
import { DateFormats } from '../../constants/dateFormats'
import { formatDate, convertToTitleCase, escapeHtml } from '../../utils/utils'
import paths from '../../constants/paths'

// eslint-disable-next-line import/prefer-default-export
export const buildPrisonersTableRows = ({
  prisoners,
  lng,
  t,
}: {
  prisoners: Prisoner[]
  lng: Locale
  t: TFunction
}): GOVUKTableRow[] => {
  if (prisoners.length === 0) {
    return []
  }

  return prisoners.map((prisoner, index) => {
    return [
      // Prisoner name
      {
        text: convertToTitleCase(`${prisoner.firstName} ${prisoner.lastName}`),
        attributes: { 'data-test': `prisoner-name-${index}` },
      },
      // Prisoner DoB
      {
        text: formatDate(prisoner.dateOfBirth, DateFormats.DISPLAY_DATE, lng),
        attributes: { 'data-test': `prisoner-dob-${index}` },
      },
      // Link to Visitors
      {
        html:
          `<a href="${paths.VISITORS}">` +
          `${t('prisoners:prisoners.viewVisitorsLink')}` +
          `<span class="govuk-visually-hidden">` +
          ` ${t('prisoners:prisoners.viewVisitorsLinkHidden', {
            name: escapeHtml(convertToTitleCase(`${prisoner.firstName} ${prisoner.lastName}`)),
          })}` +
          `</span></a>`,
        attributes: { 'data-test': `prisoner-visitors-link-${index}` },
      },
    ]
  })
}
