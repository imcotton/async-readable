import pkg from './package.json';





const dist = file => `${ process.env.OUT || './dist' }/${ file }`;



export default {

    input: './lib/index.ts',

    output: [
        {
            file: dist(pkg.main),
            format: 'cjs',
        },
        {
            file: dist(pkg.module),
            format: 'esm',
        },
    ],

    external: 'buffer|stream'.split('|'),

    plugins: [

        require('rollup-plugin-typescript')({
            typescript: require('typescript'),
        }),

    ],

};

