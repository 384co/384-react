const path = require('path');

function resolveAliasPath(relativeToBabelConf) {
  const resolvedPath = path.relative(process.cwd(), path.resolve(__dirname, relativeToBabelConf));
  return `./${resolvedPath.replace('\\', '/')}`;
}


module.exports = function (api) {
  const useESModules = api.env(['regressions', 'legacy', 'modern', 'stable', 'rollup']);

  const defaultAlias = {
    '@384/components': resolveAliasPath('./packages/components/src'),
    '@384/core': resolveAliasPath('./packages/core/src'),
  };

  const presets = [
    [
      '@babel/preset-env',
      {
        // bugfixes: true,
        // browserslistEnv: process.env.BABEL_ENV || process.env.NODE_ENV,
        debug: true,
        modules: useESModules ? false : 'commonjs',
        // shippedProposals: api.env('modern'),
      },
    ],
    [
      '@babel/preset-react',
      {
        runtime: 'automatic',
      },
    ],
    '@babel/preset-typescript',
  ];
  const plugins = [
    [
      'babel-plugin-macros',
    ],
    'babel-plugin-optimize-clsx',
    // Need the following 3 proposals for all targets in .browserslistrc.
    // With our usage the transpiled loose mode is equivalent to spec mode.
    ['@babel/plugin-proposal-class-properties', { loose: true }],
    ['@babel/plugin-proposal-private-methods', { loose: true }],
    ['@babel/plugin-proposal-private-property-in-object', { loose: true }],
    ['@babel/plugin-proposal-object-rest-spread', { loose: true }],
    [
      '@babel/plugin-transform-runtime',
      {
        useESModules,
        // any package needs to declare 7.4.4 as a runtime dependency. default is ^7.0.0
        version: '^7.4.4',
      },
    ],
    [
      'babel-plugin-transform-react-remove-prop-types',
      {
        mode: 'unsafe-wrap',
      },
    ],
  ];



  return {
    assumptions: {
      noDocumentAll: true,
    },
    presets,
    plugins,
    ignore: [/@babel[\\|/]runtime/], // Fix a Windows issue.
    // overrides: [
    //   {
    //     exclude: /\.test\.(js|ts|tsx)$/,
    //     plugins: ['@babel/plugin-transform-react-constant-elements'],
    //   },
    // ],
    env: {
      coverage: {
        plugins: [
          'babel-plugin-istanbul',
          [
            'babel-plugin-module-resolver',
            {
              root: ['./'],
              alias: defaultAlias,
            },
          ],
        ],
      },
      development: {
        plugins: [
          [
            'babel-plugin-module-resolver',
            {
              alias: {
                ...defaultAlias,
                modules: './modules',
                'typescript-to-proptypes': './packages/typescript-to-proptypes/src',
              },
              root: ['./'],
            },
          ],
        ],
      },
      // rollup: {
      //   plugins: [
      //     [
      //       'babel-plugin-module-resolver',
      //       {
      //         alias: defaultAlias,
      //       },
      //     ],
      //   ],
      // },
      legacy: {
        plugins: [
          // IE11 support
          '@babel/plugin-transform-object-assign',
        ],
      },
    },
  };
};
