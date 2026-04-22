import type { TFunction } from 'i18next'
import { MoJAlert } from '../../@types/bapv'
import { VisitDetails } from '../../services/visitService'

// eslint-disable-next-line import/prefer-default-export
export const getVisitMessages = ({
  visit,
  prisonName,
  t,
}: {
  visit: VisitDetails
  prisonName: string
  t: TFunction
}): MoJAlert[] => {
  if (visit.visitStatus === 'BOOKED' && visit.visitSubStatus !== 'REQUESTED') {
    return []
  }

  const variant: MoJAlert['variant'] = 'information'
  let text: string
  let title: string
  let showTitleAsHeading = true

  // Cancelled visits
  if (visit.visitSubStatus === 'CANCELLED') {
    switch (visit.outcomeStatus) {
      case 'BOOKER_CANCELLED':
        title = t('visits:alerts.cancelled.title')
        text = t('visits:alerts.cancelled.byBooker')
        break

      case 'PRISONER_CANCELLED':
        title = t('visits:alerts.cancelled.title')
        text = t('visits:alerts.cancelled.byPrisoner')
        break

      case 'VISITOR_CANCELLED':
        title = t('visits:alerts.cancelled.title')
        text = t('visits:alerts.cancelled.byVisitor')
        break

      default:
        title = t('visits:alerts.cancelled.title')
        text = t('visits:alerts.cancelled.byPrison')
        break
    }

    return [{ variant, title, text, showTitleAsHeading }]
  }

  // Visit requests
  switch (visit.visitSubStatus) {
    case 'REQUESTED':
      title = t('visits:alerts.requested.title')
      text = t('visits:alerts.requested.text', { prisonName })
      break

    case 'AUTO_REJECTED':
    case 'REJECTED':
      title = t('visits:alerts.rejected.title')
      showTitleAsHeading = false
      text = t('visits:alerts.rejected.text', { prisonName })
      break

    case 'WITHDRAWN':
      title = t('visits:alerts.withdrawn.title')
      showTitleAsHeading = false
      text = t('visits:alerts.withdrawn.text')
      break

    default:
      return []
  }

  return [{ variant, title, text, showTitleAsHeading }]
}
