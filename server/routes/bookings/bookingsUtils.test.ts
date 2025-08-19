import { MoJAlert } from '../../@types/bapv'
import { VisitDetails } from '../../services/visitService'
import TestData from '../testutils/testData'
import { getVisitMessages } from './bookingsUtils'

describe('Bookings utils', () => {
  describe('getVisitMessages - build messages (MoJ Alerts) to show on visit details page', () => {
    describe('Booking cancelled', () => {
      it.each([
        ['BOOKER_CANCELLED', 'You cancelled this visit.'],
        ['PRISONER_CANCELLED', 'This visit was cancelled by the prisoner.'],
        ['VISITOR_CANCELLED', 'This visit was cancelled by a visitor.'],
        ['fallback-any-other-status', 'This visit was cancelled by the prison.'],
      ])('CANCELLED visit with outcome status %s', (outcomeStatus: VisitDetails['outcomeStatus'], text: string) => {
        const visit = TestData.visitDetails({ visitStatus: 'CANCELLED', outcomeStatus })
        const expectedMessage: MoJAlert = {
          variant: 'information',
          title: 'Visit cancelled',
          showTitleAsHeading: true,
          text,
        }

        expect(getVisitMessages(visit, 'Hewell (HMP)')).toStrictEqual([expectedMessage])
      })
    })

    it('Requested visit', () => {
      const visit = TestData.visitDetails({ visitSubStatus: 'REQUESTED' })
      const expectedMessage: MoJAlert = {
        variant: 'information',
        title: 'Your request needs to be reviewed',
        showTitleAsHeading: true,
        text: 'This visit is not booked yet. It needs to be checked by Hewell (HMP).',
      }

      expect(getVisitMessages(visit, 'Hewell (HMP)')).toStrictEqual([expectedMessage])
    })

    it('Rejected visit', () => {
      const visit = TestData.visitDetails({ visitStatus: 'REJECTED', visitSubStatus: 'REJECTED' })
      const expectedMessage: MoJAlert = {
        variant: 'information',
        title: undefined,
        showTitleAsHeading: true,
        text: 'This request was rejected by Hewell (HMP).',
      }

      expect(getVisitMessages(visit, 'Hewell (HMP)')).toStrictEqual([expectedMessage])
    })

    it('Auto-rejected visit', () => {
      const visit = TestData.visitDetails({ visitSubStatus: 'AUTO_REJECTED', visitStatus: 'AUTO_REJECTED' })
      const expectedMessage: MoJAlert = {
        variant: 'information',
        title: undefined,
        showTitleAsHeading: true,
        text: 'This request was rejected by Hewell (HMP).',
      }

      expect(getVisitMessages(visit, 'Hewell (HMP)')).toStrictEqual([expectedMessage])
    })

    it('should return an empty array if no visit messages', () => {
      const visit = TestData.visitDetails()
      const messages = getVisitMessages(visit, 'Hewell (HMP)')
      expect(messages).toStrictEqual([])
    })
  })
})
