module.exports = (api) => {
  api.cache(true)

  const presets = ['module:metro-react-native-babel-preset']
  const plugins = [
    [
      'react-intl',
      {
        messagesDir: './translations/messages/',
        extractSourceLocation: true,
      },
    ],
    '@babel/plugin-proposal-export-namespace-from',
    [
      'babel-plugin-inline-import',
      {
        extensions: ['.md'],
      },
    ],
    [
      'react-native-reanimated/plugin',
      {
        relativeSourceLocation: true,
      },
    ],
  ]
  return {
    presets,
    plugins,
  }
}
