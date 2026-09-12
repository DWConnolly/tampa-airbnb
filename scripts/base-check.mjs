// Test local and deployed asset/metadata paths without replacing dist/.
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { build, createServer } from 'vite';

const root = fileURLToPath(new URL('../', import.meta.url));
for (const base of ['/', '/tampa-airbnb/', '/coastal-preview/']) {
  const server = await createServer({
    root, base, logLevel: 'error',
    server: { middlewareMode: true, watch: null },
  });
  try {
    const { assetUrl, seoConfig, galleryImages, photography, property } = await server.ssrLoadModule('/src/config/siteConfig.ts');
    assert.deepEqual(galleryImages.slice(0, 5).map(photo => photo.id), photography.previewIds);
    assert.equal(new Set(galleryImages.map(photo => photo.id)).size, 57);
    assert.ok(property.description.includes('a game of bocce'));
    assert.ok(property.description.includes('new outdoor shower'));
    assert.equal(galleryImages[0].id, 'dsc06600');
    assert.equal(assetUrl(galleryImages[0].src), `${base}images/property/dsc06600-2048.webp`);
    assert.equal(assetUrl('/images/hero.avif'), `${base}images/hero.avif`);

    const result = await build({ root, base, logLevel: 'error', build: { write: false } });
    const outputs = Array.isArray(result) ? result : [result];
    const html = outputs.flatMap(bundle => bundle.output).find(asset => asset.fileName === 'index.html')?.source;
    assert.equal(typeof html, 'string');
    const pageUrl = new URL(base, seoConfig.siteOrigin).href;
    const imageUrl = new URL(seoConfig.socialImage, pageUrl).href;
    assert.ok(html.includes(`<title>${seoConfig.title}</title>`));
    assert.ok(html.includes(`rel="canonical" href="${pageUrl}"`));
    assert.ok(html.includes(`property="og:image" content="${imageUrl}"`));
    assert.ok(html.includes(`name="twitter:image" content="${imageUrl}"`));
    assert.ok(html.includes(`href="${base}favicon.svg"`));
    assert.ok(html.includes(`src="${base}assets/`));
    assert.ok(!html.includes('aggregateRating'));
    console.log(`PASS ${base}: selected front-house hero, asset helper, title, canonical, social image, favicon, and bundle paths`);
  } finally {
    await server.close();
  }
}