import { addDays, eachDayOfInterval, format, formatDuration, getISODay, intervalToDuration, parse } from 'date-fns'
import { VisitSessionsCalendar } from '../@types/bapv'
import { HmppsAuthClient, OrchestrationApiClient, RestClientBuilder } from '../data'
import { AvailableVisitSessionDto } from '../data/orchestrationApiTypes'

export default class VisitSessionsService {
  constructor(
    private readonly orchestrationApiClientFactory: RestClientBuilder<OrchestrationApiClient>,
    private readonly hmppsAuthClient: HmppsAuthClient,
  ) {}

  private readonly dateFormat = 'yyyy-MM-dd'

  async getVisitSessionsCalendar(
    prisonId: string,
    prisonerId: string,
    visitorIds: number[],
    daysAhead: number,
  ): Promise<VisitSessionsCalendar> {
    const visitSessions = await this.getVisitSessions(prisonId, prisonerId, visitorIds)

    if (visitSessions.length === 0) {
      return { selectedDate: '', months: {} }
    }

    const calendar: VisitSessionsCalendar = {
      selectedDate: visitSessions[0].sessionDate, // TODO consider if this should be worked out in route?
      months: {},
    }

    // generate all calendar dates: first is today; last is max booking window
    const today = new Date()
    const allCalendarDates = eachDayOfInterval({
      start: format(today, this.dateFormat),
      end: format(addDays(today, daysAhead), this.dateFormat),
    })

    allCalendarDates.forEach(date => {
      const currentMonth = format(date, 'MMMM yyyy')
      if (!calendar.months[currentMonth]) {
        calendar.months[currentMonth] = { startDayColumn: getISODay(date), dates: {} }
      }

      const { dates } = calendar.months[currentMonth]
      const thisDate = format(date, this.dateFormat)
      const thisDateVisitSessions = visitSessions.filter(session => session.sessionDate === thisDate)

      dates[thisDate] = thisDateVisitSessions.map(session => {
        const startTime = parse(session.sessionTimeSlot.startTime, 'HH:mm', date)
        const endTime = parse(session.sessionTimeSlot.endTime, 'HH:mm', date)

        const startTimeFormatted = format(startTime, 'h:mmaaa').replace(':00', '')
        const endTimeFormatted = format(endTime, 'h:mmaaa').replace(':00', '')

        const duration = formatDuration(intervalToDuration({ start: startTime, end: endTime }), { delimiter: ' and ' })
        return {
          reference: session.sessionTemplateReference,
          time: `${startTimeFormatted} to ${endTimeFormatted}`,
          duration,
        }
      })
    })
    return calendar
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
