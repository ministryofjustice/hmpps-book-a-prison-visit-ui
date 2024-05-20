import { addDays, eachDayOfInterval, format } from 'date-fns'
import { HmppsAuthClient, OrchestrationApiClient, RestClientBuilder } from '../data'
import { AvailableVisitSessionDto } from '../data/orchestrationApiTypes'
import { DateFormats } from '../utils/constants'

type VisitSession = { reference: string; startTime: string; endTime: string }

// Keyed by month (yyyy-MM); all dates for each month(s), sessions for each day (keyed yyyy-MM-dd)
export type VisitSessionsCalendar = Record<string, Record<string, VisitSession[]>>

export default class VisitSessionsService {
  constructor(
    private readonly orchestrationApiClientFactory: RestClientBuilder<OrchestrationApiClient>,
    private readonly hmppsAuthClient: HmppsAuthClient,
  ) {}

  async getVisitSessionsCalendar(
    prisonId: string,
    prisonerId: string,
    visitorIds: number[],
    daysAhead: number,
  ): Promise<{ calendar: VisitSessionsCalendar; firstSessionDate: string }> {
    const visitSessions = await this.getVisitSessions(prisonId, prisonerId, visitorIds)

    if (visitSessions.length === 0) {
      return { calendar: {}, firstSessionDate: '' }
    }

    const calendar: VisitSessionsCalendar = {}
    const firstSessionDate = visitSessions[0].sessionDate
    const today = new Date()

    const allCalendarDates = eachDayOfInterval({
      start: today,
      end: addDays(today, daysAhead),
    })

    allCalendarDates.forEach(date => {
      const dateKey = format(date, DateFormats.ISO_DATE)
      const monthKey = dateKey.substring(0, 7) // get e.g. '2024-05'

      const currentMonth = calendar[monthKey] ?? (calendar[monthKey] = {})

      const visitSessionsOnDate = visitSessions.filter(session => session.sessionDate === dateKey)

      currentMonth[dateKey] = visitSessionsOnDate.map(session => {
        return {
          reference: session.sessionTemplateReference,
          startTime: session.sessionTimeSlot.startTime,
          endTime: session.sessionTimeSlot.endTime,
        }
      })
    })

    return { calendar, firstSessionDate }
  }

  private async getVisitSessions(
    prisonId: string,
    prisonerId: string,
    visitorIds: number[],
  ): Promise<AvailableVisitSessionDto[]> {
    const token = await this.hmppsAuthClient.getSystemClientToken()
    const orchestrationApiClient = this.orchestrationApiClientFactory(token)

    return orchestrationApiClient.getVisitSessions(prisonId, prisonerId, visitorIds)
  }
}
