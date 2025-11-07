import minify from 'rollup-plugin-babel-minify';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import webWorkerLoader from 'rollup-plugin-web-worker-loader';

export default {
  input: './src/js/Game.js',
  plugins: [
    webWorkerLoader({}),
    resolve(),
    commonjs(),
    minify({ comments: false, sourceMap: false })
  ],
  output: {
      format: 'iife',
      file: './assets/js/cube.js',
      indent: '\t',
      sourceMap: false,
  },
};
