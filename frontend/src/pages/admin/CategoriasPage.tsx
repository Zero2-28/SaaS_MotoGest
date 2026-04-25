import { useEffect, useState, useCallback, useRef } from 'react'
import { Plus, Pencil, Trash2, Tag, ImageIcon, X } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import {
  getCategorias, crearCategoria, editarCategoria, eliminarCategoria,
} from '@/services/categorias.service'
import { uploadCategoriaImage } from '@/services/upload.service'
import type { Categoria } from '@/types'

const schema = z.object({
  nombre:      z.string().min(2, 'Mínimo 2 caracteres'),
  descripcion: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export default function CategoriasPage() {
  const [categorias, setCategorias]   = useState<Categoria[]>([])
  const [cargando, setCargando]       = useState(true)
  const [modalOpen, setModalOpen]     = useState(false)
  const [editando, setEditando]       = useState<Categoria | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Categoria | null>(null)
  const [guardando, setGuardando]     = useState(false)
  const [error, setError]             = useState<string | null>(null)

  // Estado de imagen del modal
  const [imagenFile, setImagenFile]       = useState<File | null>(null)
  const [imagenPreview, setImagenPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const data = await getCategorias()
      setCategorias(data)
    } catch {
      setError('No se pudieron cargar las categorías.')
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  function limpiarImagen() {
    if (imagenPreview?.startsWith('blob:')) URL.revokeObjectURL(imagenPreview)
    setImagenFile(null)
    setImagenPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function cerrarModal() {
    limpiarImagen()
    setModalOpen(false)
  }

  function abrirCrear() {
    setEditando(null)
    limpiarImagen()
    reset({ nombre: '', descripcion: '' })
    setModalOpen(true)
  }

  function abrirEditar(cat: Categoria) {
    setEditando(cat)
    limpiarImagen()
    if (cat.imagen_url) setImagenPreview(cat.imagen_url)
    reset({ nombre: cat.nombre, descripcion: cat.descripcion ?? '' })
    setModalOpen(true)
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (imagenPreview?.startsWith('blob:')) URL.revokeObjectURL(imagenPreview)
    setImagenFile(file)
    setImagenPreview(URL.createObjectURL(file))
  }

  async function onSubmit(data: FormData) {
    setGuardando(true)
    try {
      // Subir imagen si hay archivo nuevo
      let imagenUrl: string | null | undefined = editando?.imagen_url ?? null
      if (imagenFile) {
        imagenUrl = await uploadCategoriaImage(imagenFile)
      }

      const payload = {
        nombre:      data.nombre,
        descripcion: data.descripcion || undefined,
        imagen_url:  imagenUrl,
      }

      if (editando) {
        const actualizada = await editarCategoria(editando.id, payload)
        setCategorias((prev) => prev.map((c) => (c.id === actualizada.id ? actualizada : c)))
      } else {
        const nueva = await crearCategoria(payload)
        setCategorias((prev) => [...prev, nueva])
      }
      cerrarModal()
    } catch {
      // Error de API — no cierra el modal
    } finally {
      setGuardando(false)
    }
  }

  async function handleEliminar(cat: Categoria) {
    setGuardando(true)
    try {
      await eliminarCategoria(cat.id)
      setCategorias((prev) => prev.filter((c) => c.id !== cat.id))
      setConfirmDelete(null)
    } catch {
      setConfirmDelete(null)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-display-sm text-[#111111]">CATEGORÍAS</h1>
          <p className="text-sm text-muted-foreground mt-1">{categorias.length} categorías en el catálogo</p>
        </div>
        <Button onClick={abrirCrear}>
          <Plus className="mr-2 h-4 w-4" />Nueva categoría
        </Button>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          {error} <button onClick={cargar} className="ml-2 underline hover:no-underline">Reintentar</button>
        </div>
      )}

      <Card className="bg-white border-gray-200">
        <CardContent className="p-0">
          {cargando ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="skeleton h-14 w-full rounded" />
              ))}
            </div>
          ) : categorias.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground text-sm">
              <Tag className="h-10 w-10 mx-auto mb-3 text-gray-400" />
              No hay categorías. Crea la primera.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB]">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#374151] uppercase tracking-wider">Nombre</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#374151] uppercase tracking-wider">Descripción</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#374151] uppercase tracking-wider">Imagen</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#374151] uppercase tracking-wider">ID</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#374151] uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {categorias.map((cat) => (
                    <tr key={cat.id} className="border-b border-gray-200 hover:bg-[#F9FAFB] transition-colors">
                      <td className="px-4 py-3 font-medium text-[#111111]">{cat.nombre}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {cat.descripcion ?? <span className="italic">Sin descripción</span>}
                      </td>
                      <td className="px-4 py-3">
                        {cat.imagen_url ? (
                          <img
                            src={cat.imagen_url}
                            alt=""
                            aria-hidden
                            className="h-10 w-10 rounded object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded bg-gray-100 flex items-center justify-center">
                            <ImageIcon className="h-4 w-4 text-gray-400" />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary">#{cat.id}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <Button
                            variant="ghost" size="icon"
                            className="text-[#374151] hover:text-[#CC0000] hover:bg-[#F9FAFB]"
                            onClick={() => abrirEditar(cat)}
                            aria-label={`Editar ${cat.nombre}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost" size="icon"
                            className="text-[#374151] hover:text-[#CC0000] hover:bg-[#FEE2E2]"
                            onClick={() => setConfirmDelete(cat)}
                            aria-label={`Eliminar ${cat.nombre}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Modal crear/editar ────────────────────────────────────────────────── */}
      <Dialog open={modalOpen} onOpenChange={(open) => { if (!open) cerrarModal() }}>
        <DialogContent className="bg-white text-[#111111]">
          <DialogHeader>
            <DialogTitle>{editando ? 'Editar categoría' : 'Nueva categoría'}</DialogTitle>
            <DialogDescription>
              {editando ? `Editando: ${editando.nombre}` : 'Completa los datos de la nueva categoría.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cat-nombre">Nombre <span className="text-racing" aria-hidden>*</span></Label>
              <Input
                id="cat-nombre"
                placeholder="Ej: Cascos, Frenos, Luces…"
                className="bg-[#F9FAFB] border-[#D1D5DB] text-[#111111] placeholder:text-[#9CA3AF] focus-visible:border-[#CC0000] focus-visible:ring-[#CC0000]/20"
                {...register('nombre')}
                aria-invalid={!!errors.nombre}
              />
              {errors.nombre && <p role="alert" className="text-xs text-red-400">{errors.nombre.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cat-desc">Descripción</Label>
              <Input id="cat-desc" placeholder="Opcional" className="bg-[#F9FAFB] border-[#D1D5DB] text-[#111111] placeholder:text-[#9CA3AF] focus-visible:border-[#CC0000] focus-visible:ring-[#CC0000]/20" {...register('descripcion')} />
            </div>

            {/* Upload de imagen */}
            <div className="flex flex-col gap-1.5">
              <Label>Imagen de categoría</Label>
              <div className="flex items-center gap-3">
                {imagenPreview ? (
                  <div className="relative shrink-0">
                    <img
                      src={imagenPreview}
                      alt="Vista previa"
                      className="h-16 w-16 rounded object-cover border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={limpiarImagen}
                      className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-gray-400 flex items-center justify-center hover:bg-red-500 transition-colors"
                      aria-label="Quitar imagen"
                    >
                      <X className="h-2.5 w-2.5 text-white" />
                    </button>
                  </div>
                ) : (
                  <div className="h-16 w-16 rounded border border-dashed border-gray-300 flex items-center justify-center shrink-0">
                    <ImageIcon className="h-6 w-6 text-gray-400" />
                  </div>
                )}
                <div className="flex flex-col gap-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="cat-imagen"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {imagenPreview ? 'Cambiar imagen' : 'Seleccionar imagen'}
                  </Button>
                  <p className="text-xs text-muted-foreground">JPG, PNG, WebP · Máx. 5 MB</p>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="secondary" onClick={cerrarModal}>Cancelar</Button>
              <Button type="submit" disabled={guardando}>
                {guardando
                  ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  : editando ? 'Guardar cambios' : 'Crear categoría'
                }
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Confirmar eliminar ────────────────────────────────────────────────── */}
      <Dialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <DialogContent className="bg-white text-[#111111]">
          <DialogHeader>
            <DialogTitle>Eliminar categoría</DialogTitle>
            <DialogDescription>
              ¿Eliminar <strong className="text-[#111111]">{confirmDelete?.nombre}</strong>?
              Los productos asociados perderán su categoría.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setConfirmDelete(null)}>Cancelar</Button>
            <Button
              variant="destructive"
              disabled={guardando}
              onClick={() => confirmDelete && handleEliminar(confirmDelete)}
            >
              {guardando
                ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                : 'Eliminar'
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
