import esbuild from 'esbuild';

const isWatch = process.argv.includes('--watch');

const ctx = await esbuild.context({
  entryPoints: ['index.tsx'],
  bundle: true,
  outfile: 'dist/bundle.js',
  minify: !isWatch,
  sourcemap: isWatch,
  define: {
    'process.env.NODE_ENV': isWatch ? '"development"' : '"production"',
  },
  loader: {
    '.tsx': 'tsx',
    '.ts': 'ts',
  },
});

if (isWatch) {
  await ctx.watch();
  console.log('esbuild is watching for changes...');
} else {
  await ctx.rebuild();
  await ctx.dispose();
  console.log('esbuild build completed.');
}
