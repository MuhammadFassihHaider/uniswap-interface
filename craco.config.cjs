/* eslint-env node */
const { VanillaExtractPlugin } = require('@vanilla-extract/webpack-plugin')
const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin')
const { execSync } = require('child_process')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const path = require('path')
const ModuleScopePlugin = require('react-dev-utils/ModuleScopePlugin')
const { IgnorePlugin, ProvidePlugin } = require('webpack')
const { RetryChunkLoadPlugin } = require('webpack-retry-chunk-load-plugin')

const commitHash = execSync('git rev-parse HEAD').toString().trim()
const isProduction = process.env.NODE_ENV === 'production'

process.env.REACT_APP_GIT_COMMIT_HASH = commitHash

// Linting and type checking are only necessary as part of development and testing.
// Omit them from production builds, as they slow down the feedback loop.
const shouldLintOrTypeCheck = !isProduction

function getCacheDirectory(cacheName) {
  // Include the trailing slash to denote that this is a directory.
  return `${path.join(__dirname, 'node_modules/.cache/', cacheName)}/`
}

module.exports = {
  eslint: {
    enable: shouldLintOrTypeCheck,
    pluginOptions(eslintConfig) {
      return Object.assign(eslintConfig, {
        cache: true,
        cacheLocation: getCacheDirectory('eslint'),
        ignorePath: '.gitignore',
        eslintPath: require.resolve('eslint'),
        resolvePluginsRelativeTo: null,
        baseConfig: null,
      })
    },
  },
  typescript: {
    enableTypeChecking: shouldLintOrTypeCheck,
  },
  jest: {
    configure(jestConfig) {
      return Object.assign(jestConfig, {
        cacheDirectory: getCacheDirectory('jest'),
        transform: {
          ...Object.entries(jestConfig.transform).reduce((transform, [key, value]) => {
            if (value.match(/babel/)) return transform
            return { ...transform, [key]: value }
          }, {}),
          '\\.css\\.ts$': '@vanilla-extract/jest-transform',
          '\\.(t|j)sx?$': '@swc/jest',
        },
        transformIgnorePatterns: ['d3-array'],
        moduleNameMapper: {
          'd3-array': 'd3-array/dist/d3-array.min.js',
        },
      })
    },
  },
  webpack: {
    plugins: [
      new ProvidePlugin({
        process: 'process/browser.js',
      }),
      new VanillaExtractPlugin(),
      new RetryChunkLoadPlugin({
        cacheBust: `function() {
          return 'cache-bust=' + Date.now();
        }`,
        retryDelay: `function(retryAttempt) {
          return 2 ** (retryAttempt - 1) * 500;
        }`,
        maxRetries: 3,
      }),
    ],
    configure: (webpackConfig) => {
      webpackConfig.plugins = webpackConfig.plugins
        .map((plugin) => {
          if (plugin instanceof MiniCssExtractPlugin) {
            plugin.options.ignoreOrder = true
          }
          if (plugin.constructor.name == 'ForkTsCheckerWebpackPlugin') {
            delete plugin.options.typescript.configOverwrite
          }
          return plugin
        })
        .filter((plugin) => {
          if (plugin instanceof CaseSensitivePathsPlugin) return false
          if (plugin instanceof IgnorePlugin) return false
          return true
        })

      webpackConfig.resolve = Object.assign(webpackConfig.resolve, {
        plugins: webpackConfig.resolve.plugins.map((plugin) => {
          if (plugin instanceof ModuleScopePlugin) {
            plugin.allowedPaths.push(path.join(__dirname, 'node_modules/@vanilla-extract/webpack-plugin'))
          }
          return plugin
        }),
        fallback: {
          ...webpackConfig.resolve.fallback,
          http: require.resolve('stream-http'),
          https: require.resolve('https-browserify'),
          path: require.resolve('path-browserify'),
        },
      })

      webpackConfig.module.rules[0] = {
        ...webpackConfig.module.rules[0],
        exclude: /node_modules/,
      }

      webpackConfig.module.rules[1].oneOf = webpackConfig.module.rules[1].oneOf.map((rule) => {
        if (rule.loader && rule.loader.match(/babel-loader/)) {
          rule.loader = 'swc-loader'
          delete rule.options
        }
        return rule
      })

      webpackConfig.module.rules.push({
        enforce: 'post',
        test: /node_modules.*\.(js)$/,
        loader: path.join(__dirname, 'scripts/terser-loader.js'),
        options: { compress: true, mangle: false },
      })

      webpackConfig.optimization = Object.assign(
        webpackConfig.optimization,
        isProduction
          ? {
              splitChunks: {
                maxSize: 5 * 1024 * 1024,
                chunks: 'all',
              },
            }
          : {}
      )

      webpackConfig.resolve = Object.assign(webpackConfig.resolve, { unsafeCache: true })

      return webpackConfig
    },
  },
}
