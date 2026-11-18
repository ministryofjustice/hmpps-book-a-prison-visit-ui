import { RequestHandler } from 'express'
import { matchedData, ValidationChain, validationResult } from 'express-validator'
import { UUID } from 'crypto'
import paths from '../../../constants/paths'
import { BookerService } from '../../../services'
import config from '../../../config'
import { validatePrisonerDisplayId } from '../validations'

export default class CheckVisitorDetailsController {
  public constructor(private readonly bookerService: BookerService) {}

  public view(): RequestHandler {
    return async (req, res) => {
      const { addVisitorJourney } = req.session
      const { prisonerDisplayId } = matchedData<{ prisonerDisplayId: UUID }>(req)
      const errors = validationResult(req)

      if (
        !errors.isEmpty() ||
        !addVisitorJourney ||
        !addVisitorJourney.prisoner ||
        prisonerDisplayId !== addVisitorJourney.prisoner.prisonerDisplayId
      ) {
        return res.redirect(config.features.multiplePrisoners ? paths.PRISONERS : paths.VISITORS)
      }

      return res.render('pages/visitors/addVisitor/checkVisitorDetails', {
        showOLServiceNav: true,
        visitorDetails: addVisitorJourney.visitorDetails,
        prisoner: addVisitorJourney.prisoner,
      })
    }
  }

  public submit(): RequestHandler {
    return async (req, res) => {
      const { addVisitorJourney, booker } = req.session
      const { prisonerDisplayId } = matchedData<{ prisonerDisplayId: UUID }>(req)
      const errors = validationResult(req)

      if (
        !errors.isEmpty() ||
        !addVisitorJourney ||
        !booker ||
        !addVisitorJourney.prisoner ||
        prisonerDisplayId !== addVisitorJourney.prisoner.prisonerDisplayId
      ) {
        return res.redirect(config.features.multiplePrisoners ? paths.PRISONERS : paths.VISITORS)
      }

      const { visitorDetails } = addVisitorJourney
      const result = await this.bookerService.addVisitorRequest({
        bookerReference: booker.reference,
        prisonerId: addVisitorJourney.prisoner.prisonerNumber,
        addVisitorRequest: {
          firstName: visitorDetails.firstName,
          lastName: visitorDetails.lastName,
          dateOfBirth: visitorDetails.visitorDob,
          languagePreference: visitorDetails.languagePreference,
        },
      })

      req.session.addVisitorJourneyResult = {
        firstName: visitorDetails.firstName,
        lastName: visitorDetails.lastName,
        result,
        prisoner: addVisitorJourney.prisoner,
      }
      delete req.session.addVisitorJourney

      switch (result) {
        case 'REQUESTED':
          return res.redirect(paths.ADD_VISITOR.SUCCESS)

        case 'AUTO_APPROVED':
          return res.redirect(paths.ADD_VISITOR.AUTO_APPROVED)

        case 'MAX_IN_PROGRESS_REQUESTS_REACHED':
          return res.redirect(paths.ADD_VISITOR.FAIL_TOO_MANY_REQUESTS)

        case 'REQUEST_ALREADY_EXISTS':
          return res.redirect(paths.ADD_VISITOR.FAIL_ALREADY_REQUESTED)

        case 'VISITOR_ALREADY_EXISTS':
          return res.redirect(paths.ADD_VISITOR.FAIL_ALREADY_LINKED)

        case 'PRISONER_NOT_FOUND_FOR_BOOKER':
        default:
          return res.redirect(config.features.multiplePrisoners ? paths.PRISONERS : paths.VISITS.HOME)
      }
    }
  }

  public validate(): ValidationChain[] {
    return [validatePrisonerDisplayId]
  }
}
