import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { property, seoConfig } from './src/config/siteConfig'

let resolvedBase = '/tampa-airbnb/'

// https://vite.dev/config/
export default defineConfig({
  base: '/tampa-airbnb/',
  plugins: [react(), tailwindcss(), {
    name: 'property-metadata',
    transformIndexHtml: {
      order: 'post',
      handler(_html, context) {
        // Resolved base also respects `vite build --base /another-path/`.
        const base = context.server?.config.base ?? resolvedBase
        const url = new URL(base, seoConfig.siteOrigin).href
        const image = new URL(seoConfig.socialImage, url).href
        const meta = (name: string, content: string, social = false) => ({
          tag: 'meta', attrs: { [social ? 'property' : 'name']: name, content }, injectTo: 'head' as const,
        })
        return [
          { tag: 'title', children: seoConfig.title, injectTo: 'head' as const },
          meta('description', seoConfig.description),
          { tag: 'link', attrs: { rel: 'canonical', href: url }, injectTo: 'head' as const },
          meta('og:type', 'website', true),
          meta('og:site_name', property.name, true),
          meta('og:title', seoConfig.title, true),
          meta('og:description', seoConfig.description, true),
          meta('og:url', url, true),
          meta('og:image', image, true),
          meta('og:image:alt', seoConfig.socialImageAlt, true),
          meta('twitter:card', 'summary_large_image'),
          meta('twitter:title', seoConfig.title),
          meta('twitter:description', seoConfig.description),
          meta('twitter:image', image),
          meta('twitter:image:alt', seoConfig.socialImageAlt),
        ]
      },
    },
    configResolved(config) { resolvedBase = config.base },
  }],
})
