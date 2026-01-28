import { MoJAlert } from '../../@types/bapv'
import { VisitDetails } from '../../services/visitService'

// eslint-disable-next-line import/prefer-default-export
export const getVisitMessages = ({ visit, prisonName }: { visit: VisitDetails; prisonName: string }): MoJAlert[] => {
  if (visit.visitStatus === 'BOOKED' && visit.visitSubStatus !== 'REQUESTED') {
    return []
  }

  const message: MoJAlert = {
    variant: 'information',
    text: '',
    title: '',
    showTitleAsHeading: true,
  }

  // Cancelled visits
  if (visit.visitSubStatus === 'CANCELLED') {
    switch (visit.outcomeStatus) {
      case 'BOOKER_CANCELLED':
        message.title = 'Visit cancelled'
        message.text = 'You cancelled this visit.'
        break

      case 'PRISONER_CANCELLED':
        message.title = 'Visit cancelled'
        message.text = 'This visit was cancelled by the prisoner.'
        break

      case 'VISITOR_CANCELLED':
        message.title = 'Visit cancelled'
        message.text = 'This visit was cancelled by a visitor.'
        break

      default:
        message.title = 'Visit cancelled'
        message.text = 'This visit was cancelled by the prison.'
        break
    }

    return [message]
  }

  // Visit requests
  switch (visit.visitSubStatus) {
    case 'REQUESTED':
      message.title = 'Your request needs to be reviewed'
      message.text = `This visit is not booked yet. It needs to be checked by ${prisonName}.`
      break

    case 'AUTO_REJECTED':
    case 'REJECTED':
      message.title = 'Your request was rejected'
      message.showTitleAsHeading = false
      message.text = `This request was rejected by ${prisonName}.`
      break

    case 'WITHDRAWN':
      message.title = 'Visit request cancelled'
      message.showTitleAsHeading = false
      message.text = 'You cancelled this visit request.'
      break

    default:
      return []
  }

  return [message]
}
