import config from '../../config'

type FeatureNames = keyof typeof config.features

export const enableFeatureForTest = (feature: FeatureNames) => {
  jest.replaceProperty(config, 'features', {
    ...config.features,
    [feature]: true,
  })
}

export const disableFeatureForTest = (feature: FeatureNames) => {
  jest.replaceProperty(config, 'features', {
    ...config.features,
    [feature]: false,
  })
}
