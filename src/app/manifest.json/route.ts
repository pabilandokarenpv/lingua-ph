export async function GET() {
  return Response.json({
    name: 'Lingua PH — Philippine Indigenous Languages',
    short_name: 'Lingua PH',
    description: 'Preserve and learn Philippine indigenous languages',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#0A84FF',
    orientation: 'portrait',
    scope: '/',
    icons: [
      { src: '/logo.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/logo.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' }
    ],
  })
}
