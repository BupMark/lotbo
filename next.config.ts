import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  async headers() {
    const rules = [
      {
        source: '/((?!_next/static|_next/image|favicon|icon|manifest|.*\\.png|.*\\.svg|.*\\.ico).*)',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate' },
        ],
      },
      {
        source: '/(icon.*|manifest\\.json|favicon.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=604800' },
        ],
      },
    ]

    // Chunks /_next/static/ sont content-hashés uniquement en production ;
    // un cache immutable en dev sert d'anciens bundles JS après chaque changement.
    if (process.env.NODE_ENV === 'production') {
      rules.push({
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      })
    }

    return rules
  },
}

export default nextConfig
