import type { Prisoner } from '../../services/bookerService'
import { GOVUKTableRow } from '../../@types/bapv'
import type { Locale } from '../../constants/locales'
import { DateFormats } from '../../constants/dateFormats'
import { formatDate, convertToTitleCase } from '../../utils/utils'

// eslint-disable-next-line import/prefer-default-export
export const buildPrisonersTableRows = ({
  prisoners,
  lng,
}: {
  prisoners: Prisoner[]
  lng: Locale
}): GOVUKTableRow[] => {
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
    ]
  })
}
