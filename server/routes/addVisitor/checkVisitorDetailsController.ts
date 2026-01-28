import { RequestHandler } from 'express'
import paths from '../../constants/paths'
import { BookerService } from '../../services'

export default class CheckVisitorDetailsController {
  public constructor(private readonly bookerService: BookerService) {}

  public view(): RequestHandler {
    return async (req, res) => {
      const { addVisitorJourney } = req.session

      if (!addVisitorJourney) {
        return res.redirect(paths.ADD_VISITOR.DETAILS)
      }

      return res.render('pages/addVisitor/checkVisitorDetails', {
        showOLServiceNav: true,
        visitorDetails: addVisitorJourney.visitorDetails,
      })
    }
  }

  public submit(): RequestHandler {
    return async (req, res) => {
      const { addVisitorJourney, booker } = req.session

      if (!addVisitorJourney || !booker.prisoners?.length) {
        return res.redirect(paths.VISITORS)
      }

      const { visitorDetails } = addVisitorJourney
      const result = await this.bookerService.addVisitorRequest({
        bookerReference: booker.reference,
        prisonerId: booker.prisoners[0].prisonerNumber,
        addVisitorRequest: {
          firstName: visitorDetails.firstName,
          lastName: visitorDetails.lastName,
          dateOfBirth: visitorDetails.visitorDob,
        },
      })

      addVisitorJourney.result = result

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
          return res.redirect(paths.HOME)
      }
    }
  }
}
