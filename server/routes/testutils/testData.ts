export default class TestData {
  static supportedPrisonIds = ({ prisonIds = ['HEI', 'BLI'] } = {}): string[] => prisonIds
}
