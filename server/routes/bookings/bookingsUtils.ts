import { MoJAlert } from '../../@types/bapv'
import { VisitDetails } from '../../services/visitService'

// eslint-disable-next-line import/prefer-default-export
export const getVisitMessages = (visit: VisitDetails, prisonName: string): MoJAlert[] => {
  if (
    // message only possible if visit is cancelled, or requested/rejected/auto_rejected
    visit.visitStatus !== 'CANCELLED' &&
    visit.visitSubStatus !== 'REQUESTED' &&
    visit.visitSubStatus !== 'REJECTED' &&
    visit.visitSubStatus !== 'AUTO_REJECTED'
  ) {
    return []
  }

  const message: MoJAlert = {
    variant: 'information',
    text: '',
    title: '',
    showTitleAsHeading: true,
  }

  if (visit.visitSubStatus === 'REQUESTED') {
    message.title = 'Your request needs to be reviewed'
    message.text = `This visit is not booked yet. It needs to be checked by ${prisonName}.`
  } else if (visit.visitSubStatus === 'REJECTED' || visit.visitSubStatus === 'AUTO_REJECTED') {
    message.title = 'Your request was rejected'
    message.showTitleAsHeading = false
    message.text = `This request was rejected by ${prisonName}.`
  } else {
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
  }

  return [message]
}
