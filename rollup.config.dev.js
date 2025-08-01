import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default {
  input: './src/js/Game.js',
  plugins: [
    resolve(),
    commonjs(),
  ],
  output: {
      format: 'iife',
      file: './assets/js/cube.js',
      indent: '\t',
      sourceMap: false,
  },
};
