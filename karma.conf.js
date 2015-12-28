module.exports = function (config) {
    config.set({
        plugins: [
          require('karma-webpack'),
          require('karma-tap'),
          require('karma-chrome-launcher'),
          require('karma-phantomjs-launcher'),
          require('karma-coverage'),
          require('karma-coveralls')
        ],
        basePath: '',
        frameworks: ['tap'],
        files: ['test/**/*.js'],
        preprocessors: {
            'test/**/*.js': ['webpack']
        },
        webpack: {
            node: {
                fs: 'empty'
            },
            module: {
                loaders: [{
                    test: /test\/.*\.js$/,
                    exclude: /node_modules\//,
                    loader: 'babel-loader'
                }],
                postLoaders: [{
                    test: /\.js$/,
                    exclude: /(test|node_modules)\//,
                    loader: 'istanbul-instrumenter'
                }]
            }
        },
        webpackMiddleWare: {
            noInfo: true
        },
        reporters: [
            'progress',
            'coverage',
            'coveralls'
        ],
        coverageReporter: {
            type: 'lcov',
            dir: 'coverage/'
        },
        port: 9876,
        colors: true,
        logLevel: config.LOG_INFO,
        autoWatch: true,
        browsers: ['Chrome', 'PhantomJS'],
        singleRun: false,
        concurrency: Infinity
    });
};
