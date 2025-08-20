import { MoJAlert } from '../../@types/bapv'
import { VisitDetails } from '../../services/visitService'
import TestData from '../testutils/testData'
import { getVisitMessages } from './bookingsUtils'

describe('Bookings utils', () => {
  const { prisonName } = TestData.prisonDto()

  describe('getVisitMessages - build messages (MoJ Alerts) to show on visit details page', () => {
    describe('Booking cancelled', () => {
      it.each([
        ['BOOKER_CANCELLED', 'You cancelled this visit.'],
        ['PRISONER_CANCELLED', 'This visit was cancelled by the prisoner.'],
        ['VISITOR_CANCELLED', 'This visit was cancelled by a visitor.'],
        ['fallback-any-other-status', 'This visit was cancelled by the prison.'],
      ])('CANCELLED visit with outcome status %s', (outcomeStatus: VisitDetails['outcomeStatus'], text: string) => {
        const visit = TestData.visitDetails({ visitStatus: 'CANCELLED', visitSubStatus: 'CANCELLED', outcomeStatus })
        const expectedMessage: MoJAlert = {
          variant: 'information',
          title: 'Visit cancelled',
          showTitleAsHeading: true,
          text,
        }

        expect(getVisitMessages({ visit, prisonName })).toStrictEqual([expectedMessage])
      })
    })

    it('visit request', () => {
      const visit = TestData.visitDetails({ visitSubStatus: 'REQUESTED' })
      const expectedMessage: MoJAlert = {
        variant: 'information',
        title: 'Your request needs to be reviewed',
        showTitleAsHeading: true,
        text: `This visit is not booked yet. It needs to be checked by ${prisonName}.`,
      }

      expect(getVisitMessages({ visit, prisonName })).toStrictEqual([expectedMessage])
    })

    it('rejected visit request', () => {
      const visit = TestData.visitDetails({ visitStatus: 'CANCELLED', visitSubStatus: 'REJECTED' })
      const expectedMessage: MoJAlert = {
        variant: 'information',
        title: 'Your request was rejected',
        showTitleAsHeading: false,
        text: `This request was rejected by ${prisonName}.`,
      }

      expect(getVisitMessages({ visit, prisonName })).toStrictEqual([expectedMessage])
    })

    it('auto-rejected visit request', () => {
      const visit = TestData.visitDetails({ visitStatus: 'CANCELLED', visitSubStatus: 'AUTO_REJECTED' })
      const expectedMessage: MoJAlert = {
        variant: 'information',
        title: 'Your request was rejected',
        showTitleAsHeading: false,
        text: `This request was rejected by ${prisonName}.`,
      }

      expect(getVisitMessages({ visit, prisonName })).toStrictEqual([expectedMessage])
    })

    it('withdrawn visit request', () => {
      const visit = TestData.visitDetails({ visitStatus: 'CANCELLED', visitSubStatus: 'WITHDRAWN' })
      const expectedMessage: MoJAlert = {
        variant: 'information',
        title: 'Visit request cancelled',
        showTitleAsHeading: false,
        text: 'You cancelled this visit request.',
      }

      expect(getVisitMessages({ visit, prisonName })).toStrictEqual([expectedMessage])
    })

    it('should return an empty array if no visit messages', () => {
      const visit = TestData.visitDetails()
      const messages = getVisitMessages({ visit, prisonName })
      expect(messages).toStrictEqual([])
    })
  })
})
