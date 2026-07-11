import { useEffect, useMemo, useState } from 'react'
import {
  Check,
  FileImage,
  FileText,
  Image,
  LoaderCircle,
  Shapes,
  X,
} from 'lucide-react'

import { getExportFrames } from '#/editor/export-model'
import type { ExportFormat, ExportScope } from '#/editor/export-model'
import { exportFrames } from '#/editor/export-renderer'
import { useEditorStore } from '#/editor/store'

interface ExportDialogProps {
  open: boolean
  onClose: () => void
}

const formats: Array<{
  format: ExportFormat
  label: string
  detail: string
  icon: typeof FileImage
}> = [
  { format: 'png', label: 'PNG', detail: 'Lossless raster', icon: FileImage },
  { format: 'jpeg', label: 'JPEG', detail: 'Compact raster', icon: Image },
  { format: 'svg', label: 'SVG', detail: 'Scalable document', icon: Shapes },
  { format: 'pdf', label: 'PDF', detail: 'One page per frame', icon: FileText },
]

export function ExportDialog({ open, onClose }: ExportDialogProps) {
  const nodes = useEditorStore((state) => state.nodes)
  const order = useEditorStore((state) => state.order)
  const selection = useEditorStore((state) => state.selection)
  const title = useEditorStore((state) => state.title)
  const [format, setFormat] = useState<ExportFormat>('png')
  const [scope, setScope] = useState<ExportScope>('selection')
  const [scale, setScale] = useState(2)
  const [pending, setPending] = useState(false)
  const [complete, setComplete] = useState(false)
  const [error, setError] = useState('')

  const selectedFrames = useMemo(
    () => getExportFrames(nodes, order, selection, 'selection'),
    [nodes, order, selection],
  )
  const allFrames = useMemo(
    () => getExportFrames(nodes, order, selection, 'all'),
    [nodes, order, selection],
  )
  const effectiveScope = selectedFrames.length ? scope : 'all'
  const exportableFrames =
    effectiveScope === 'selection' ? selectedFrames : allFrames

  useEffect(() => {
    if (!open) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !pending) onClose()
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [onClose, open, pending])

  useEffect(() => {
    if (!open) {
      setComplete(false)
      setError('')
    }
  }, [open])

  if (!open) return null

  const startExport = async () => {
    setPending(true)
    setComplete(false)
    setError('')
    try {
      await exportFrames({
        documentTitle: title,
        format,
        frames: exportableFrames,
        scale: format === 'svg' ? 1 : scale,
      })
      setComplete(true)
    } catch (exportError) {
      setError(
        exportError instanceof Error
          ? exportError.message
          : 'The export could not be created.',
      )
    } finally {
      setPending(false)
    }
  }

  return (
    <div
      className="export-backdrop"
      role="presentation"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget && !pending) onClose()
      }}
    >
      <section
        className="export-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-title"
      >
        <header className="export-dialog-header">
          <div>
            <span>OUTPUT / 01</span>
            <h2 id="export-title">Export canvas</h2>
          </div>
          <button type="button" autoFocus onClick={onClose} disabled={pending}>
            <X size={16} />
            <span className="sr-only">Close export dialog</span>
          </button>
        </header>

        <div className="export-section">
          <div className="export-section-label">
            <span>Scope</span>
            <small>{exportableFrames.length} frame(s)</small>
          </div>
          <div className="export-scope-control">
            <button
              type="button"
              data-active={effectiveScope === 'selection'}
              disabled={!selectedFrames.length}
              onClick={() => setScope('selection')}
            >
              Selection
              <small>
                {selectedFrames.length
                  ? selectedFrames.map(({ name }) => name).join(', ')
                  : 'Select any layer inside a frame'}
              </small>
            </button>
            <button
              type="button"
              data-active={effectiveScope === 'all'}
              onClick={() => setScope('all')}
            >
              All frames
              <small>{allFrames.map(({ name }) => name).join(', ')}</small>
            </button>
          </div>
        </div>

        <div className="export-section">
          <div className="export-section-label">
            <span>Format</span>
            <small>{format === 'pdf' ? 'Multipage' : 'Design asset'}</small>
          </div>
          <div className="export-format-grid">
            {formats.map((item) => {
              const Icon = item.icon
              return (
                <button
                  type="button"
                  key={item.format}
                  data-active={format === item.format}
                  onClick={() => setFormat(item.format)}
                >
                  <Icon size={18} />
                  <strong>{item.label}</strong>
                  <small>{item.detail}</small>
                  {format === item.format && <Check size={13} />}
                </button>
              )
            })}
          </div>
        </div>

        {format !== 'svg' && (
          <div className="export-section export-scale-section">
            <div className="export-section-label">
              <span>Resolution</span>
              <small>{scale}× pixel density</small>
            </div>
            <div className="export-scale-control">
              {[1, 2, 3].map((value) => (
                <button
                  type="button"
                  key={value}
                  data-active={scale === value}
                  onClick={() => setScale(value)}
                >
                  {value}×
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="export-summary">
          <div>
            <strong>
              {exportableFrames.length > 1 && format !== 'pdf'
                ? 'ZIP package'
                : formats.find((item) => item.format === format)?.label}
            </strong>
            <span>
              Fonts and visual styles embedded · editor controls excluded
            </span>
          </div>
          <button
            type="button"
            className="export-confirm-button"
            disabled={pending || !exportableFrames.length}
            onClick={startExport}
          >
            {pending ? (
              <LoaderCircle className="auth-spinner" size={15} />
            ) : complete ? (
              <Check size={15} />
            ) : (
              <FileImage size={15} />
            )}
            {pending ? 'Rendering…' : complete ? 'Downloaded' : 'Export'}
          </button>
        </div>
        {error && <p className="export-error">{error}</p>}
      </section>
    </div>
  )
}
