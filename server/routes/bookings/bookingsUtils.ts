import { MoJAlert } from '../../@types/bapv'
import { VisitDetails } from '../../services/visitService'

// eslint-disable-next-line import/prefer-default-export
export const getVisitMessages = (visit: VisitDetails): MoJAlert[] => {
  if (visit.visitStatus !== 'CANCELLED') {
    return []
  }

  const message: MoJAlert = {
    variant: 'information',
    title: 'Visit cancelled',
    showTitleAsHeading: true,
    text: '',
  }

  switch (visit.outcomeStatus) {
    case 'BOOKER_CANCELLED':
      message.text = 'You cancelled this visit.'
      break

    case 'PRISONER_CANCELLED':
      message.text = 'This visit was cancelled by the prisoner.'
      break

    case 'VISITOR_CANCELLED':
      message.text = 'This visit was cancelled by a visitor.'
      break

    default:
      message.text = 'This visit was cancelled by the prison.'
      break
  }

  return [message]
}
