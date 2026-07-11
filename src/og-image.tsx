import { CustomFont, ImageResponse } from 'cf-workers-og'

import archivoRegularDataUrl from '@fontsource/archivo/files/archivo-latin-400-normal.woff?inline'
import archivoSemiboldDataUrl from '@fontsource/archivo/files/archivo-latin-600-normal.woff?inline'
import newsreaderBoldDataUrl from '@fontsource/newsreader/files/newsreader-latin-700-normal.woff?inline'

export type OgVariant = 'home' | 'studio'

const fonts = [
  new CustomFont('Newsreader', decodeDataUrl(newsreaderBoldDataUrl), {
    weight: 700,
  }),
  new CustomFont('Archivo', decodeDataUrl(archivoRegularDataUrl), {
    weight: 400,
  }),
  new CustomFont('Archivo', decodeDataUrl(archivoSemiboldDataUrl), {
    weight: 600,
  }),
]

function decodeDataUrl(dataUrl: string): ArrayBuffer {
  const encoded = dataUrl.slice(dataUrl.indexOf(',') + 1)
  const binary = atob(encoded)
  const bytes = new Uint8Array(binary.length)

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }

  return bytes.buffer
}

export function getOgVariant(request: Request): OgVariant {
  return new URL(request.url).searchParams.get('variant') === 'studio'
    ? 'studio'
    : 'home'
}

export async function renderOgImage(request: Request): Promise<Response> {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response('Method not allowed', {
      status: 405,
      headers: { Allow: 'GET, HEAD' },
    })
  }

  const response = await ImageResponse.create(
    <OgCard variant={getOgVariant(request)} />,
    {
      width: 1200,
      height: 630,
      format: 'png',
      fonts,
      headers: {
        'Cache-Control':
          'public, max-age=3600, s-maxage=604800, stale-while-revalidate=86400',
        'Content-Disposition': 'inline; filename="offset-og.png"',
        'X-Content-Type-Options': 'nosniff',
      },
    },
  )

  if (request.method === 'HEAD') {
    return new Response(null, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    })
  }

  return response
}

function OffsetMark() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        fontFamily: 'Archivo',
        fontSize: 19,
        fontWeight: 600,
        letterSpacing: '0.16em',
        color: '#121411',
      }}
    >
      <div
        style={{
          display: 'flex',
          width: 30,
          height: 30,
          marginRight: 13,
          border: '2px solid #121411',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: 12,
            height: 12,
            background: '#f0643f',
            transform: 'translate(4px, -4px)',
          }}
        />
      </div>
      OFFSET
    </div>
  )
}

function EditorPreview({ variant }: { variant: OgVariant }) {
  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        width: 458,
        height: 462,
        overflow: 'hidden',
        flexDirection: 'column',
        background: '#171a18',
        border: '1px solid #090a09',
        boxShadow: '18px 20px 0 #d7d2c7',
      }}
    >
      <div
        style={{
          display: 'flex',
          height: 44,
          padding: '0 16px',
          flexShrink: 0,
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #333733',
          color: '#f0ede5',
          fontFamily: 'Archivo',
          fontSize: 10,
          letterSpacing: '0.12em',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div
            style={{
              width: 8,
              height: 8,
              marginRight: 8,
              borderRadius: 8,
              background: '#f0643f',
            }}
          />
          {variant === 'studio' ? 'SHARED ROOM' : 'LANDING.PAGE'}
        </div>
        <div style={{ display: 'flex', color: '#8e958e' }}>72%</div>
      </div>

      <div style={{ display: 'flex', flex: 1 }}>
        <div
          style={{
            display: 'flex',
            width: 86,
            padding: '17px 12px',
            flexDirection: 'column',
            borderRight: '1px solid #333733',
            fontFamily: 'Archivo',
            fontSize: 9,
            color: '#8e958e',
          }}
        >
          <div
            style={{
              display: 'flex',
              marginBottom: 14,
              color: '#f0ede5',
              fontWeight: 600,
              letterSpacing: '0.08em',
            }}
          >
            LAYERS
          </div>
          {['Frame', 'Heading', 'Actions', 'Notes'].map((label, index) => (
            <div
              key={label}
              style={{
                display: 'flex',
                height: 30,
                marginBottom: 5,
                padding: '0 7px',
                alignItems: 'center',
                color: index === 1 ? '#171a18' : '#a7ada7',
                background: index === 1 ? '#f0ede5' : 'transparent',
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  marginRight: 7,
                  border:
                    index === 1 ? '1px solid #171a18' : '1px solid #676d67',
                }}
              />
              {label}
            </div>
          ))}
        </div>

        <div
          style={{
            position: 'relative',
            display: 'flex',
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#242825',
            backgroundImage:
              'radial-gradient(circle, #555b55 1px, transparent 1px)',
            backgroundSize: '16px 16px',
          }}
        >
          <div
            style={{
              position: 'relative',
              display: 'flex',
              width: 274,
              height: 315,
              padding: '24px 25px',
              flexDirection: 'column',
              background: '#f1eee6',
              color: '#121411',
              boxShadow: '0 18px 40px rgba(0,0,0,0.32)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontFamily: 'Archivo',
                fontSize: 7,
                fontWeight: 600,
                letterSpacing: '0.13em',
              }}
            >
              <div style={{ display: 'flex' }}>OFFSET</div>
              <div style={{ display: 'flex', color: '#f0643f' }}>LIVE</div>
            </div>
            <div
              style={{
                display: 'flex',
                marginTop: 40,
                flexDirection: 'column',
                fontFamily: 'Newsreader',
                fontSize: 34,
                fontWeight: 700,
                lineHeight: 0.92,
              }}
            >
              <div style={{ display: 'flex' }}>Make ideas</div>
              <div style={{ display: 'flex' }}>tangible.</div>
            </div>
            <div
              style={{
                display: 'flex',
                width: 48,
                height: 5,
                marginTop: 21,
                background: '#f0643f',
              }}
            />
            <div
              style={{
                display: 'flex',
                marginTop: 'auto',
                fontFamily: 'Archivo',
                fontSize: 7,
                lineHeight: 1.45,
                color: '#545852',
              }}
            >
              HTML, React, and every layer between.
            </div>
          </div>

          <div
            style={{
              position: 'absolute',
              display: 'flex',
              top: 72,
              right: 22,
              padding: '5px 8px',
              background: '#f0643f',
              color: '#121411',
              fontFamily: 'Archivo',
              fontSize: 8,
              fontWeight: 600,
            }}
          >
            MIKE
          </div>
          <div
            style={{
              position: 'absolute',
              display: 'flex',
              right: 67,
              bottom: 56,
              padding: '5px 8px',
              background: '#b8d8c0',
              color: '#121411',
              fontFamily: 'Archivo',
              fontSize: 8,
              fontWeight: 600,
            }}
          >
            YOU
          </div>
        </div>
      </div>
    </div>
  )
}

function OgCard({ variant }: { variant: OgVariant }) {
  const isStudio = variant === 'studio'

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        padding: '52px 54px 48px',
        flexDirection: 'column',
        background: '#f1eee6',
        color: '#121411',
      }}
    >
      {[150, 382, 614, 846, 1078].map((left) => (
        <div
          key={left}
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left,
            width: 1,
            background: '#dfdbd1',
          }}
        />
      ))}
      <div
        style={{
          position: 'absolute',
          top: 124,
          right: 0,
          width: 570,
          height: 1,
          background: '#dfdbd1',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 0,
          bottom: 78,
          width: 660,
          height: 1,
          background: '#dfdbd1',
        }}
      />

      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <OffsetMark />
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            fontFamily: 'Archivo',
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.11em',
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              marginRight: 9,
              borderRadius: 8,
              background: '#f0643f',
            }}
          />
          {isStudio ? 'SHARED AT THE EDGE' : 'DESIGN IN THE BROWSER'}
        </div>
      </div>

      <div
        style={{
          position: 'relative',
          display: 'flex',
          flex: 1,
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div
          style={{
            display: 'flex',
            width: 585,
            paddingTop: 20,
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              display: 'flex',
              marginBottom: 20,
              fontFamily: 'Archivo',
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: '0.15em',
              color: '#f0643f',
            }}
          >
            {isStudio ? 'MULTIPLAYER CANVAS / 01' : 'INTERFACE CANVAS / 01'}
          </div>
          <div
            style={{
              display: 'flex',
              fontFamily: 'Newsreader',
              fontSize: isStudio ? 79 : 83,
              fontWeight: 700,
              letterSpacing: '-0.045em',
              lineHeight: 0.91,
            }}
          >
            {isStudio ? (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                Design here.
                <div style={{ display: 'flex', color: '#f0643f' }}>
                  Together.
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                The browser is
                <div style={{ display: 'flex' }}>
                  your <span style={{ color: '#f0643f' }}>&nbsp;artboard.</span>
                </div>
              </div>
            )}
          </div>
          <div
            style={{
              display: 'flex',
              width: 490,
              marginTop: 30,
              fontFamily: 'Archivo',
              fontSize: 17,
              lineHeight: 1.45,
              color: '#545852',
            }}
          >
            {isStudio
              ? 'A live canvas with layers, precision controls, and multiplayer presence built in.'
              : 'Build live React and HTML interfaces with layers, inspection, and real-time collaboration.'}
          </div>
        </div>

        <EditorPreview variant={variant} />
      </div>

      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontFamily: 'Archivo',
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: '0.11em',
        }}
      >
        <div style={{ display: 'flex' }}>HTML + REACT + EDGE STATE</div>
        <div style={{ display: 'flex' }}>1200 × 630 / OFFSET</div>
      </div>
    </div>
  )
}
