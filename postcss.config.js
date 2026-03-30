module.exports = {
  plugins: {
    autoprefixer: {
      overrideBrowserslist: [
        '> 1%',
        'last 2 versions',
        'not dead',
        'not ie <= 11'
      ],
      grid: 'autoplace',
      flexbox: 'no-2009'
    },
    cssnano: {
      preset: [
        'default',
        {
          discardComments: {
            removeAll: true
          },
          normalizeWhitespace: true,
          colormin: true,
          minifyFontValues: true,
          minifySelectors: true,
          reduceIdents: false,
          zindex: false,
          discardUnused: {
            fontFace: false,
            keyframes: false
          },
          mergeRules: true,
          cssDeclarationSorter: {
            order: 'alphabetically'
          }
        }
      ]
    }
  }
};
