const babelJest = require('babel-jest').default;

module.exports = babelJest.createTransformer({
  presets: [
    '@babel/preset-env',
    ['@babel/preset-react', { runtime: 'automatic' }],
    '@babel/preset-typescript'
  ],
  plugins: [
    ['babel-plugin-transform-import-meta', {
      importMetaName: '__IMETA'
    }]
  ]
});
