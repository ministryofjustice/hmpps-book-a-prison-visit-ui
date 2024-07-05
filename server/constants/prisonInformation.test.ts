import getPrisonInformation from './prisonInformation'

describe('Prison configuration', () => {
  it('should return correct prison information for requested prisonId', () => {
    const prisonConfiguration = getPrisonInformation('DHI')

    expect(prisonConfiguration.prisonName).toBe('Drake Hall (HMP)')
    expect(prisonConfiguration.prisonPhoneNumber).toBe('0121 661 2101')
    expect(prisonConfiguration.prisonWebsite).toBe('https://www.gov.uk/guidance/drake-hall-prison')
  })

  it('should return default prison information when none available for requested prisonId', () => {
    const prisonConfiguration = getPrisonInformation('')

    expect(prisonConfiguration.prisonName.length).toBe(0)
    expect(prisonConfiguration.prisonPhoneNumber.length).toBe(0)
    expect(prisonConfiguration.prisonWebsite.length).toBe(0)
  })
})
