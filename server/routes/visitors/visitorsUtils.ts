import { formatDate } from '../../utils/utils'
import type { Visitor } from '../../services/bookerService'
import { GOVUKTableRow } from '../../@types/bapv'

// eslint-disable-next-line import/prefer-default-export
export const buildVisitorsTableRows = (visitors: Visitor[]): GOVUKTableRow[] => {
  return visitors.map((visitor, index) => {
    let canBookText = 'Yes'
    if (visitor.banned) {
      canBookText = visitor.banExpiryDate ? `Banned until ${formatDate(visitor.banExpiryDate)}` : 'Banned'
    }

    return [
      // Visitor name
      {
        text: `${visitor.firstName} ${visitor.lastName}`,
        attributes: { 'data-test': `visitor-name-${index}` },
      },
      // Visitor DoB
      {
        text: formatDate(visitor.dateOfBirth),
        attributes: { 'data-test': `visitor-dob-${index}` },
      },
      // Can you book for visitor?
      {
        text: canBookText,
        classes: visitor.banned ? 'warning' : '',
        attributes: { 'data-test': `visitor-availability-${index}` },
      },
    ]
  })
}
