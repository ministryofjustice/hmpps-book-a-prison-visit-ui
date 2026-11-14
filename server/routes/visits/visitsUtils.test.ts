import { MoJAlert } from '../../@types/bapv'
import { VisitDetails } from '../../services/visitService'
import TestData from '../testutils/testData'
import { getVisitDetailsSummaries, getVisitMessages } from './visitsUtils'
import { mockTFunction } from '../../data/testutils/mockI18n'

describe('Visits utils', () => {
  describe('getVisitDetailsSummaries', () => {
    it('should return visit details summaries', () => {
      const prisoner = TestData.prisoner()
      const visit = TestData.visitDetails()

      const summaries = getVisitDetailsSummaries({ prisoners: [prisoner], visits: [visit] })

      expect(summaries.length).toBe(1)
      expect(summaries[0]).toStrictEqual({
        visitDisplayId: visit.visitDisplayId,
        reference: visit.reference,
        prisonerFirstName: visit.prisonerFirstName,
        prisonerLastName: visit.prisonerLastName,
        prisonId: visit.prisonId,
        startTimestamp: visit.startTimestamp,
        endTimestamp: visit.endTimestamp,
        isRequest: false,
        prisonerMoved: false,
      })
    })

    it('should flag a visit with REQUESTED status', () => {
      const prisoner = TestData.prisoner()
      const visit = TestData.visitDetails({ visitSubStatus: 'REQUESTED' })

      const summaries = getVisitDetailsSummaries({ prisoners: [prisoner], visits: [visit] })

      expect(summaries[0].reference).toBe(visit.reference)
      expect(summaries[0].isRequest).toBe(true)
    })

    it('should flag prisoner moved if prisoner exists but registered prison differs from visit prison', () => {
      const prisoner = TestData.prisoner({ registeredPrisonId: 'BLI' })
      const visit = TestData.visitDetails()

      const summaries = getVisitDetailsSummaries({ prisoners: [prisoner], visits: [visit] })

      expect(summaries[0].reference).toBe(visit.reference)
      expect(summaries[0].prisonerMoved).toBe(true)
    })

    it('should not flag prisoner moved if prisoner not found (i.e. no longer on booker account)', () => {
      const visit = TestData.visitDetails()

      const summaries = getVisitDetailsSummaries({ prisoners: [], visits: [visit] })

      expect(summaries[0].reference).toBe(visit.reference)
      expect(summaries[0].prisonerMoved).toBe(false)
    })
  })

  describe('getVisitMessages - build messages (MoJ Alerts) to show on visit details page', () => {
    const { prisonName } = TestData.prisonDto()

    describe('Visit cancelled', () => {
      it.each([
        ['BOOKER_CANCELLED', 'visits:alerts.cancelled.byBooker'],
        ['PRISONER_CANCELLED', 'visits:alerts.cancelled.byPrisoner'],
        ['VISITOR_CANCELLED', 'visits:alerts.cancelled.byVisitor'],
        [null, 'visits:alerts.cancelled.byPrison'], // i.e. any other outcomeStatus
      ] as const)(
        'CANCELLED visit with outcome status %s',
        (outcomeStatus: VisitDetails['outcomeStatus'], text: string) => {
          const visit = TestData.visitDetails({ visitStatus: 'CANCELLED', visitSubStatus: 'CANCELLED', outcomeStatus })
          const expectedMessage: MoJAlert = {
            variant: 'information',
            title: 'visits:alerts.cancelled.title',
            showTitleAsHeading: true,
            text,
          }

          expect(getVisitMessages({ visit, prisonName, t: mockTFunction })).toStrictEqual([expectedMessage])
        },
      )
    })

    it('visit request', () => {
      const visit = TestData.visitDetails({ visitSubStatus: 'REQUESTED' })
      const expectedMessage: MoJAlert = {
        variant: 'information',
        title: 'visits:alerts.requested.title',
        showTitleAsHeading: true,
        text: `visits:alerts.requested.text|prisonName:Hewell (HMP & YOI)`,
      }

      expect(getVisitMessages({ visit, prisonName, t: mockTFunction })).toStrictEqual([expectedMessage])
    })

    it('rejected visit request', () => {
      const visit = TestData.visitDetails({ visitStatus: 'CANCELLED', visitSubStatus: 'REJECTED' })
      const expectedMessage: MoJAlert = {
        variant: 'information',
        title: 'visits:alerts.rejected.title',
        showTitleAsHeading: false,
        text: `visits:alerts.rejected.text|prisonName:Hewell (HMP & YOI)`,
      }

      expect(getVisitMessages({ visit, prisonName, t: mockTFunction })).toStrictEqual([expectedMessage])
    })

    it('auto-rejected visit request', () => {
      const visit = TestData.visitDetails({ visitStatus: 'CANCELLED', visitSubStatus: 'AUTO_REJECTED' })
      const expectedMessage: MoJAlert = {
        variant: 'information',
        title: 'visits:alerts.rejected.title',
        showTitleAsHeading: false,
        text: `visits:alerts.rejected.text|prisonName:Hewell (HMP & YOI)`,
      }

      expect(getVisitMessages({ visit, prisonName, t: mockTFunction })).toStrictEqual([expectedMessage])
    })

    it('withdrawn visit request', () => {
      const visit = TestData.visitDetails({ visitStatus: 'CANCELLED', visitSubStatus: 'WITHDRAWN' })
      const expectedMessage: MoJAlert = {
        variant: 'information',
        title: 'visits:alerts.withdrawn.title',
        showTitleAsHeading: false,
        text: 'visits:alerts.withdrawn.text',
      }

      expect(getVisitMessages({ visit, prisonName, t: mockTFunction })).toStrictEqual([expectedMessage])
    })

    it('should return an empty array if no visit messages', () => {
      const visit = TestData.visitDetails()
      const messages = getVisitMessages({ visit, prisonName, t: mockTFunction })
      expect(messages).toStrictEqual([])
    })
  })
})
