type PrisonInformation = {
  prisonName: string
  prisonPhoneNumber: string
  prisonWebsite: string
}

const prisonInformation: Record<string, PrisonInformation> = {
  DHI: {
    prisonName: 'Drake Hall (HMP & YOI)',
    prisonPhoneNumber: '0121 661 2101',
    prisonWebsite: 'https://www.gov.uk/guidance/drake-hall-prison',
  },
  FHI: {
    prisonName: 'Foston Hall (HMP & YOI)',
    prisonPhoneNumber: '0121 661 2101',
    prisonWebsite: 'https://www.gov.uk/guidance/foston-hall-prison',
  },
} as const

const defaultConfiguration: PrisonInformation = {
  prisonName: '',
  prisonPhoneNumber: '',
  prisonWebsite: '',
}

const getPrisonInformation = (prisonId: string): PrisonInformation => {
  return prisonInformation[prisonId] ?? defaultConfiguration
}

export default getPrisonInformation
