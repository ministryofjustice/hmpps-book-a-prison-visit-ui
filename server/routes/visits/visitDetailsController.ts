import type { RequestHandler } from 'express'
import { ValidationChain, matchedData, validationResult } from 'express-validator'
import { SessionData } from 'express-session'
import { PrisonService } from '../../services'
import paths from '../../constants/paths'
import { getVisitMessages } from './visitsUtils'
import { VisitDetails } from '../../services/visitService'
import { validateVisitDisplayId } from './validations'

export default class VisitDetailsController {
  // label visits with these statuses as a 'request' rather than a 'visit'
  private readonly REQUEST_STATUSES: VisitDetails['visitSubStatus'][] = [
    'AUTO_REJECTED',
    'REJECTED',
    'REQUESTED',
    'WITHDRAWN',
  ]

  public constructor(private readonly prisonService: PrisonService) {}

  public view(type: SessionData['bookedVisits']['type']): RequestHandler {
    return async (req, res) => {
      const { bookedVisits } = req.session

      const errors = validationResult(req)
      if (!errors.isEmpty() || bookedVisits.type !== type) {
        return res.redirect(paths.VISITS.HOME)
      }

      const { visitDisplayId } = matchedData<{ visitDisplayId: string }>(req)

      const { visits } = bookedVisits
      const visit = visits.find(v => v.visitDisplayId === visitDisplayId)

      const prison = await this.prisonService.getPrison(visit.prisonId)

      const messages = getVisitMessages({ visit, prisonName: prison.prisonName })

      const nowTimestamp = new Date()
      const visitStartTimestamp = new Date(visit.startTimestamp)
      const showCancelButton = nowTimestamp < visitStartTimestamp && visit.visitStatus !== 'CANCELLED'

      const backLinkHref =
        (type === 'past' && paths.VISITS.PAST) || (type === 'cancelled' && paths.VISITS.CANCELLED) || paths.VISITS.HOME

      return res.render('pages/visits/visit', {
        backLinkHref,
        prison,
        type,
        messages,
        visit,
        showCancelButton,
        showOLServiceNav: true,
        isRequest: this.REQUEST_STATUSES.includes(visit.visitSubStatus),
      })
    }
  }

  public validate(): ValidationChain[] {
    return [validateVisitDisplayId]
  }
}
