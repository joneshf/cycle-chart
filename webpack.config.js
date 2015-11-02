'use strict';

var path = require('path');

module.exports = {
  entry: {
    index: ['./index.js'],
  },
  module: {
    loaders: [
      { loader: 'babel', test: /\.js$/, },
      { loader: 'json', test: /\.json$/, },
    ],
  },
  node: {
    fs: 'empty',
  },
  output: {
    filename: '[name].bundle.js',
  },
  resolve: {
    alias: {
      'vega-scenegraph': path.resolve(
        __dirname,
        'node_modules/vega-scenegraph/vega-scenegraph.js'
      ),
    },
  },
};
