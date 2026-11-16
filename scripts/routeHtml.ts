import { seoConfig } from '../src/config/siteConfig'

const escapeAttr = (value: string) => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// Copies the built index.html for each client route so GitHub Pages serves it
// directly (HTTP 200) with route-specific title, description and canonical URL.
export function routeHtml(html: string, base: string, route: { path: string; title: string; description: string; noindex?: boolean }) {
  const homeUrl = new URL(base, seoConfig.siteOrigin).href
  const pageUrl = new URL(route.path, homeUrl).href
  const swaps: [string, string][] = [
    [`<title>${seoConfig.title}</title>`, `<title>${route.title}</title>`],
    [`href="${homeUrl}"`, `href="${pageUrl}"`],
    [`content="${homeUrl}"`, `content="${pageUrl}"`],
    [`content="${escapeAttr(seoConfig.title)}"`, `content="${escapeAttr(route.title)}"`],
    [`content="${escapeAttr(seoConfig.description)}"`, `content="${escapeAttr(route.description)}"`],
  ]
  let output = html
  for (const [from, to] of swaps) {
    if (!output.includes(from)) throw new Error(`Route HTML for ${route.path}: expected ${from}`)
    output = output.replace(new RegExp(escapeRegExp(from), 'g'), to)
  }
  if (route.noindex) output = output.replace('</head>', '  <meta name="robots" content="noindex">\n  </head>')
  return output
}
