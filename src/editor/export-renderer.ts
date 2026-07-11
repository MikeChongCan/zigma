import type { ExportFormat, ExportFrame } from './export-model'
import { getExportFilename } from './export-model'

interface ExportOptions {
  documentTitle: string
  format: ExportFormat
  frames: ExportFrame[]
  scale: number
}

const ignoredClasses = new Set([
  'frame-label',
  'locked-indicator',
  'remote-cursor',
  'resize-handle',
  'selection-outline',
  'selection-size',
])

function includeInExport(node: Node): boolean {
  if (!(node instanceof Element)) return true
  return ![...ignoredClasses].some((className) =>
    node.classList.contains(className),
  )
}

function getFrameElement(frameId: string): HTMLElement {
  const wrapper = document.querySelector<HTMLElement>(
    `[data-node-id="${CSS.escape(frameId)}"]`,
  )
  const surface = wrapper?.querySelector<HTMLElement>(
    ':scope > .canvas-node-surface',
  )
  if (!surface) throw new Error('The frame is not currently rendered.')
  return surface
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const response = await fetch(dataUrl)
  return response.blob()
}

export async function exportFrames({
  documentTitle,
  format,
  frames,
  scale,
}: ExportOptions): Promise<void> {
  if (!frames.length) throw new Error('Select a frame to export.')
  await document.fonts.ready

  const image = await import('html-to-image')
  const firstElement = getFrameElement(frames[0].id)
  const fontEmbedCSS = await image.getFontEmbedCSS(firstElement, {
    preferredFontFormat: 'woff2',
  })

  const render = async (frame: ExportFrame, targetFormat: ExportFormat) => {
    const element = getFrameElement(frame.id)
    const options = {
      width: frame.width,
      height: frame.height,
      pixelRatio: scale,
      fontEmbedCSS,
      preferredFontFormat: 'woff2',
      filter: includeInExport,
      style: {
        display: 'block',
        margin: '0',
        opacity: '1',
        position: 'relative',
        transform: 'none',
      },
      ...(targetFormat === 'jpeg' ? { backgroundColor: '#ffffff' } : {}),
    }

    if (targetFormat === 'svg') return image.toSvg(element, options)
    if (targetFormat === 'jpeg') {
      return image.toJpeg(element, { ...options, quality: 0.94 })
    }
    return image.toPng(element, options)
  }

  if (format === 'pdf') {
    const { jsPDF } = await import('jspdf')
    const first = frames[0]
    const pdf = new jsPDF({
      orientation: first.width >= first.height ? 'landscape' : 'portrait',
      unit: 'px',
      format: [first.width, first.height],
      compress: true,
      hotfixes: ['px_scaling'],
    })

    for (const [index, frame] of frames.entries()) {
      if (index > 0) {
        pdf.addPage(
          [frame.width, frame.height],
          frame.width >= frame.height ? 'landscape' : 'portrait',
        )
      }
      const dataUrl = await render(frame, 'png')
      pdf.addImage(
        dataUrl,
        'PNG',
        0,
        0,
        frame.width,
        frame.height,
        undefined,
        'FAST',
      )
    }

    downloadBlob(
      pdf.output('blob'),
      getExportFilename(documentTitle, undefined, 'pdf'),
    )
    return
  }

  const extension = format === 'jpeg' ? 'jpg' : format
  if (frames.length === 1) {
    const dataUrl = await render(frames[0], format)
    downloadBlob(
      await dataUrlToBlob(dataUrl),
      getExportFilename(documentTitle, frames[0].name, extension),
    )
    return
  }

  const [{ default: JSZip }, rendered] = await Promise.all([
    import('jszip'),
    Promise.all(
      frames.map(async (frame) => ({
        frame,
        blob: await dataUrlToBlob(await render(frame, format)),
      })),
    ),
  ])
  const zip = new JSZip()
  for (const { frame, blob } of rendered) {
    zip.file(getExportFilename(documentTitle, frame.name, extension), blob)
  }
  downloadBlob(
    await zip.generateAsync({ type: 'blob' }),
    getExportFilename(documentTitle, undefined, 'zip'),
  )
}
