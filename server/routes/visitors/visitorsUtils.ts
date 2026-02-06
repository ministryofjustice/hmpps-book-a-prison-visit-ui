import { formatDate } from '../../utils/utils'
import type { Visitor } from '../../services/bookerService'
import { GOVUKTableRow } from '../../@types/bapv'
import { BookerPrisonerVisitorRequestDto } from '../../data/orchestrationApiTypes'

export const buildVisitorsTableRows = (visitors: Visitor[]): GOVUKTableRow[] => {
  return visitors.map((visitor, index) => {
    let canBookText = 'Yes'
    if (visitor.banned) {
      canBookText = `No, banned${visitor.banExpiryDate ? ` until ${formatDate(visitor.banExpiryDate)}` : ''}`
    } else if (!visitor.approved) {
      canBookText = `No, visitor not approved`
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
        classes: visitor.banned || !visitor.approved ? 'warning' : '',
        attributes: { 'data-test': `visitor-availability-${index}` },
      },
    ]
  })
}

export const buildVisitorRequestsTableRows = (visitors: BookerPrisonerVisitorRequestDto[]): GOVUKTableRow[] => {
  return visitors.map((visitor, index) => {
    return [
      // Visitor name
      {
        text: `${visitor.firstName} ${visitor.lastName}`,
        attributes: { 'data-test': `visitor-request-name-${index}` },
      },
      // Visitor DoB
      {
        text: formatDate(visitor.dateOfBirth),
        attributes: { 'data-test': `visitor-request-dob-${index}` },
      },
    ]
  })
}
