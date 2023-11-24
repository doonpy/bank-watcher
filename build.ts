const result = await Bun.build({
  entrypoints: ['./src/main.ts'],
  outdir: './dist',
  target: 'bun',
  minify: true,
  external: ['puppeteer'],
});

console.log(result);
