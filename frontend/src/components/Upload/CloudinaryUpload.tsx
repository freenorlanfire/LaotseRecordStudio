/**
 * CloudinaryUpload — sube un archivo directo a Cloudinary usando firma del backend.
 *
 * Flujo:
 *   1. Llama a POST /api/upload/sign?type=audio|cover  →  { signature, timestamp, cloud_name, api_key, folder }
 *   2. Hace POST multipart a https://api.cloudinary.com/v1_1/{cloud_name}/{resource}/upload
 *   3. Devuelve la `secure_url` resultante al componente padre
 */

import { useRef, useState, DragEvent, ChangeEvent } from 'react'
import { UploadCloud, CheckCircle2, AlertCircle, Loader2, X } from 'lucide-react'
import clsx from 'clsx'
import { API_BASE } from '../../lib/api'

type UploadType = 'audio' | 'cover'

interface Props {
  type: UploadType
  label: string
  accept: string
  onUpload: (url: string) => void
  currentUrl?: string
}

interface SignResponse {
  signature: string
  timestamp: number
  cloud_name: string
  api_key: string
  folder: string
}

async function getSignature(type: UploadType): Promise<SignResponse> {
  const token = localStorage.getItem('ltr_token')
  const res = await fetch(`${API_BASE}/upload/sign?type=${type}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('No se pudo obtener la firma de subida')
  return res.json()
}

async function uploadToCloudinary(file: File, sign: SignResponse): Promise<string> {
  const resource = file.type.startsWith('audio') ? 'video' : 'image' // Cloudinary usa "video" para audio
  const url = `https://api.cloudinary.com/v1_1/${sign.cloud_name}/${resource}/upload`

  const fd = new FormData()
  fd.append('file', file)
  fd.append('api_key', sign.api_key)
  fd.append('timestamp', String(sign.timestamp))
  fd.append('signature', sign.signature)
  fd.append('folder', sign.folder)

  const res = await fetch(url, { method: 'POST', body: fd })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message ?? `Cloudinary error ${res.status}`)
  }
  const data = await res.json()
  return data.secure_url as string
}

type Status = 'idle' | 'signing' | 'uploading' | 'done' | 'error'

export function CloudinaryUpload({ type, label, accept, onUpload, currentUrl }: Props) {
  const [status,   setStatus]   = useState<Status>('idle')
  const [progress, setProgress] = useState(0)
  const [error,    setError]    = useState('')
  const [fileName, setFileName] = useState('')
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    setStatus('signing')
    setError('')
    setFileName(file.name)
    setProgress(0)

    try {
      const sign = await getSignature(type)
      setStatus('uploading')

      // Simular progreso con XHR para tener progress events
      const secureUrl = await uploadWithProgress(file, sign, (p) => setProgress(p))

      setStatus('done')
      setProgress(100)
      onUpload(secureUrl)
    } catch (e: unknown) {
      setStatus('error')
      setError(e instanceof Error ? e.message : 'Error al subir archivo')
    }
  }

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const reset = () => {
    setStatus('idle')
    setProgress(0)
    setFileName('')
    setError('')
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="space-y-1.5">
      <label className="block text-xs uppercase tracking-widest text-white/40">{label}</label>

      <div
        onClick={() => status === 'idle' && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={clsx(
          'relative rounded-xl border-2 border-dashed transition-all cursor-pointer select-none',
          'flex flex-col items-center justify-center gap-3 py-6 px-4 text-center',
          status === 'idle' && !dragging && 'border-studio-border hover:border-gold/40 hover:bg-gold/5',
          dragging && 'border-gold/60 bg-gold/10',
          status === 'uploading' && 'border-gold/30 bg-gold/5 cursor-default',
          status === 'done'      && 'border-green-500/40 bg-green-500/5 cursor-default',
          status === 'error'     && 'border-red-500/40 bg-red-500/5 cursor-default',
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={onChange}
        />

        {status === 'idle' && (
          <>
            <UploadCloud size={28} className={clsx('transition-colors', dragging ? 'text-gold' : 'text-white/20')} />
            <div>
              <p className="text-sm text-white/60">
                Arrastra aquí o <span className="text-gold">selecciona archivo</span>
              </p>
              <p className="text-xs text-white/20 mt-1">{accept.replace(/\./g, '').replace(/,/g, ', ').toUpperCase()}</p>
            </div>
            {currentUrl && (
              <p className="text-xs text-gold/60 truncate max-w-full px-4">
                ✓ Ya tiene archivo subido
              </p>
            )}
          </>
        )}

        {(status === 'signing' || status === 'uploading') && (
          <>
            <Loader2 size={28} className="animate-spin text-gold" />
            <div className="w-full max-w-xs">
              <p className="text-sm text-white/60 truncate mb-2">{fileName}</p>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gold rounded-full transition-all duration-300"
                  style={{ width: `${status === 'signing' ? 5 : progress}%` }}
                />
              </div>
              <p className="text-xs text-white/30 mt-1.5">
                {status === 'signing' ? 'Preparando…' : `Subiendo… ${progress}%`}
              </p>
            </div>
          </>
        )}

        {status === 'done' && (
          <>
            <CheckCircle2 size={28} className="text-green-400" />
            <div>
              <p className="text-sm text-green-400 font-medium">¡Subido correctamente!</p>
              <p className="text-xs text-white/30 mt-0.5 truncate max-w-xs">{fileName}</p>
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); reset() }}
              className="absolute top-2 right-2 p-1 rounded-full hover:bg-white/10 text-white/30 hover:text-white transition-colors"
            >
              <X size={14} />
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <AlertCircle size={28} className="text-red-400" />
            <div>
              <p className="text-sm text-red-400 font-medium">Error al subir</p>
              <p className="text-xs text-white/40 mt-0.5">{error}</p>
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); reset() }}
              className="mt-1 text-xs text-gold/70 hover:text-gold underline underline-offset-2"
            >
              Intentar de nuevo
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ── XHR con progress real ────────────────────────────────────────────────────
function uploadWithProgress(
  file: File,
  sign: SignResponse,
  onProgress: (p: number) => void,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const resource = file.type.startsWith('audio') ? 'video' : 'image'
    const url = `https://api.cloudinary.com/v1_1/${sign.cloud_name}/${resource}/upload`

    const fd = new FormData()
    fd.append('file', file)
    fd.append('api_key', sign.api_key)
    fd.append('timestamp', String(sign.timestamp))
    fd.append('signature', sign.signature)
    fd.append('folder', sign.folder)

    const xhr = new XMLHttpRequest()
    xhr.open('POST', url)

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100))
      }
    })

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const data = JSON.parse(xhr.responseText)
        resolve(data.secure_url)
      } else {
        try {
          const err = JSON.parse(xhr.responseText)
          reject(new Error(err?.error?.message ?? `Cloudinary ${xhr.status}`))
        } catch {
          reject(new Error(`Cloudinary error ${xhr.status}`))
        }
      }
    })

    xhr.addEventListener('error', () => reject(new Error('Error de red al subir')))
    xhr.send(fd)
  })
}
