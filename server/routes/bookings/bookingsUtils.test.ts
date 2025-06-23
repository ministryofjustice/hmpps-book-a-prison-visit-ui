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

        expect(getVisitMessages(visit)).toStrictEqual([expectedMessage])
      })
    })

    it('should return an empty array if no visit messages', () => {
      const visit = TestData.visitDetails()
      const messages = getVisitMessages(visit)
      expect(messages).toStrictEqual([])
    })
  })
})
