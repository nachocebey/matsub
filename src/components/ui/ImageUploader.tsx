'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Upload, X, Loader2, Star } from 'lucide-react'

interface Props {
  images: string[]
  folder: 'trips' | 'courses' | 'spots'
  onChange: (images: string[]) => void
}

export function ImageUploader({ images, folder, onChange }: Props) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const upload = async (files: FileList) => {
    setUploading(true)
    const newUrls: string[] = []

    for (const file of Array.from(files)) {
      const ext = file.name.split('.').pop()
      const path = `${folder}/${crypto.randomUUID()}.${ext}`
      const { error } = await supabase.storage.from('images').upload(path, file)
      if (!error) {
        const { data } = supabase.storage.from('images').getPublicUrl(path)
        newUrls.push(data.publicUrl)
      }
    }

    onChange([...images, ...newUrls])
    setUploading(false)
  }

  const remove = async (url: string) => {
    const path = url.split('/storage/v1/object/public/images/')[1]
    if (path) await supabase.storage.from('images').remove([path])
    onChange(images.filter(u => u !== url))
  }

  const setCover = (url: string) => {
    onChange([url, ...images.filter(u => u !== url)])
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-2">
        {images.map((url, i) => (
          <div key={url} className="relative aspect-video rounded-lg overflow-hidden group border border-ocean-100">
            <Image src={url} alt="" fill sizes="200px" className="object-cover" />
            {i === 0 ? (
              <span className="absolute bottom-1 left-1 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1">
                <Star className="h-2.5 w-2.5 fill-white" /> Portada
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setCover(url)}
                className="absolute bottom-1 left-1 bg-black/60 text-white rounded p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Usar como portada"
              >
                <Star className="h-3 w-3" />
              </button>
            )}
            <button
              type="button"
              onClick={() => remove(url)}
              className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="aspect-video rounded-lg border-2 border-dashed border-ocean-200 hover:border-ocean-400 flex flex-col items-center justify-center gap-1 text-ocean-400 hover:text-ocean-600 transition-colors disabled:opacity-50"
        >
          {uploading
            ? <Loader2 className="h-5 w-5 animate-spin" />
            : <><Upload className="h-5 w-5" /><span className="text-xs font-medium">Subir</span></>
          }
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={e => e.target.files?.length && upload(e.target.files)}
      />
    </div>
  )
}
