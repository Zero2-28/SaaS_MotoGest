import { useEffect, useState, useCallback } from 'react'
import { Plus, Pencil, UserX } from 'lucide-react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  getEmpleados, crearEmpleado, editarEmpleado, desactivarEmpleado,
} from '@/services/empleados.service'
import type { EmpleadoDetalle, Sucursal } from '@/types'
import { useAuthEmpleadoStore } from '@/stores/auth.store'
import api from '@/services/api'

// Rol IDs fijos que coinciden con el seed del backend (rolId 1=admin, 2=vendedor, 3=repartidor)
const ROL_OPTIONS = [
  { id: 1, name: 'admin',      label: 'Admin'      },
  { id: 2, name: 'vendedor',   label: 'Vendedor'   },
  { id: 3, name: 'repartidor', label: 'Repartidor' },
]

const ROL_BADGE: Record<string, string> = {
  admin:      'bg-red-100 text-[#CC0000]',
  vendedor:   'bg-orange-100 text-[#FF6B00]',
  repartidor: 'bg-blue-100 text-[#3B82F6]',
}

const ROL_AVATAR_BG: Record<string, string> = {
  admin:      '#CC0000',
  vendedor:   '#FF6B00',
  repartidor: '#3B82F6',
}

const empleadoSchema = z.object({
  nombre:     z.string().min(2, 'Nombre requerido'),
  email:      z.string().email('Email inválido'),
  password:   z.string().min(8, 'Mínimo 8 caracteres').or(z.literal('')).optional(),
  rolId:      z.coerce.number().int().positive('Selecciona un rol'),
  sucursalId: z.coerce.number().int().positive().optional(),
})

type EmpleadoForm = z.infer<typeof empleadoSchema>

function AvatarInitial({ nombre, rolName }: { nombre: string; rolName: string }) {
  const bg = ROL_AVATAR_BG[rolName] ?? '#6B7280'
  return (
    <span
      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
      style={{ backgroundColor: bg }}
      aria-hidden
    >
      {nombre.charAt(0).toUpperCase()}
    </span>
  )
}

export default function EmpleadosPage() {
  const [empleados, setEmpleados]     = useState<EmpleadoDetalle[]>([])
  const [sucursales, setSucursales]   = useState<Sucursal[]>([])
  const [cargando, setCargando]       = useState(true)
  const [modalOpen, setModalOpen]     = useState(false)
  const [guardando, setGuardando]     = useState(false)
  const [editando, setEditando]       = useState<EmpleadoDetalle | null>(null)
  const [confirmDes, setConfirmDes]   = useState<EmpleadoDetalle | null>(null)
  const [desactivando, setDesactivando] = useState(false)
  const [pwdError, setPwdError]       = useState<string | null>(null)

  const { empleado: usuarioActual } = useAuthEmpleadoStore()

  const {
    register, handleSubmit, reset, control,
    formState: { errors },
  } = useForm<EmpleadoForm>({ resolver: zodResolver(empleadoSchema) })

  const cargar = useCallback(async () => {
    setCargando(true)
    try {
      const data = await getEmpleados()
      setEmpleados(data)
    } catch {
      // Error de red silenciado
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    void cargar()
    api.get<Sucursal[]>('/sucursales')
      .then(({ data }) => setSucursales(data))
      .catch(() => {})
  }, [cargar])

  function abrirCrear() {
    setEditando(null)
    setPwdError(null)
    reset({ nombre: '', email: '', password: '', rolId: undefined, sucursalId: undefined })
    setModalOpen(true)
  }

  function abrirEditar(emp: EmpleadoDetalle) {
    setEditando(emp)
    setPwdError(null)
    reset({
      nombre:     emp.nombre,
      email:      emp.email,
      password:   '',
      rolId:      emp.rolId,
      sucursalId: emp.sucursalId ?? undefined,
    })
    setModalOpen(true)
  }

  async function onSubmit(data: EmpleadoForm) {
    if (!editando && !data.password) {
      setPwdError('La contraseña es obligatoria al crear un empleado.')
      return
    }
    setPwdError(null)
    setGuardando(true)
    try {
      if (editando) {
        const payload: Parameters<typeof editarEmpleado>[1] = {
          nombre:     data.nombre,
          email:      data.email,
          rolId:      data.rolId,
          sucursalId: data.sucursalId ?? null,
        }
        if (data.password) payload.password = data.password
        const actualizado = await editarEmpleado(editando.id, payload)
        setEmpleados((prev) => prev.map((e) => (e.id === actualizado.id ? actualizado : e)))
      } else {
        const nuevo = await crearEmpleado({
          nombre:     data.nombre,
          email:      data.email,
          password:   data.password!,
          rolId:      data.rolId,
          sucursalId: data.sucursalId,
        })
        setEmpleados((prev) => [nuevo, ...prev])
      }
      setModalOpen(false)
    } catch {
      // Error de API — el modal permanece abierto para reintentar
    } finally {
      setGuardando(false)
    }
  }

  async function confirmarDesactivar() {
    if (!confirmDes) return
    setDesactivando(true)
    try {
      await desactivarEmpleado(confirmDes.id)
      setEmpleados((prev) =>
        prev.map((e) => (e.id === confirmDes.id ? { ...e, activo: false } : e))
      )
      setConfirmDes(null)
    } catch {
      // Error silenciado
    } finally {
      setDesactivando(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-display-sm text-[#111111]">EMPLEADOS</h1>
          <p className="text-sm text-muted-foreground mt-1">Gestión del personal del sistema</p>
        </div>
        <Button onClick={abrirCrear}>
          <Plus className="mr-2 h-4 w-4" />Nuevo empleado
        </Button>
      </div>

      {/* Tabla */}
      <div className="rounded-lg border border-gray-200 bg-white overflow-x-auto">
        {cargando ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-gray-200 animate-pulse h-12 w-full rounded" />
            ))}
          </div>
        ) : empleados.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-[#666666] text-sm">No hay empleados registrados.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#374151] uppercase tracking-wide">Empleado</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#374151] uppercase tracking-wide">Email</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#374151] uppercase tracking-wide">Rol</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#374151] uppercase tracking-wide">Sucursal</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#374151] uppercase tracking-wide">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {empleados.filter((e) => e && e.rol && e.id !== usuarioActual?.id).map((emp) => (
                <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <AvatarInitial nombre={emp.nombre} rolName={emp.rol?.name ?? 'sin rol'} />
                      <span className="font-medium text-[#111111]">{emp.nombre}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[#374151]">{emp.email}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${ROL_BADGE[emp.rol?.name ?? ''] ?? 'bg-gray-100 text-[#374151]'}`}>
                      {emp.rol?.name ?? 'sin rol'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#374151]">
                    {emp.sucursal?.nombre ?? <span className="text-[#9CA3AF]">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={emp.activo ? 'stock-ok' : 'stock-critico'}>
                      {emp.activo ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-[#374151] hover:text-[#CC0000] hover:bg-[#F9FAFB] rounded-lg p-2"
                        onClick={() => abrirEditar(emp)}
                        aria-label={`Editar ${emp.nombre}`}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      {emp.activo && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg p-2"
                          onClick={() => setConfirmDes(emp)}
                          aria-label={`Desactivar ${emp.nombre}`}
                        >
                          <UserX className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal crear / editar */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="bg-white text-[#111111]">
          <DialogHeader>
            <DialogTitle className="text-[#111111]">
              {editando ? 'Editar empleado' : 'Nuevo empleado'}
            </DialogTitle>
            <DialogDescription className="text-[#666666]">
              {editando
                ? 'Modifica los datos del empleado. Deja la contraseña vacía para no cambiarla.'
                : 'Completa los datos para crear un nuevo empleado.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="emp-nombre">Nombre <span className="text-racing" aria-hidden>*</span></Label>
                <Input
                  id="emp-nombre"
                  className="bg-[#F9FAFB] border-[#D1D5DB] text-[#111111] placeholder:text-[#9CA3AF]"
                  {...register('nombre')}
                  aria-invalid={!!errors.nombre}
                />
                {errors.nombre && <p role="alert" className="text-xs text-red-500">{errors.nombre.message}</p>}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="emp-email">Email <span className="text-racing" aria-hidden>*</span></Label>
                <Input
                  id="emp-email"
                  type="email"
                  className="bg-[#F9FAFB] border-[#D1D5DB] text-[#111111] placeholder:text-[#9CA3AF]"
                  {...register('email')}
                  aria-invalid={!!errors.email}
                />
                {errors.email && <p role="alert" className="text-xs text-red-500">{errors.email.message}</p>}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="emp-pwd">
                Contraseña
                {!editando && <span className="text-racing ml-1" aria-hidden>*</span>}
                {editando && <span className="text-xs text-[#9CA3AF] ml-1">(vacío = sin cambios)</span>}
              </Label>
              <Input
                id="emp-pwd"
                type="password"
                className="bg-[#F9FAFB] border-[#D1D5DB] text-[#111111]"
                {...register('password')}
                aria-invalid={!!errors.password || !!pwdError}
              />
              {errors.password && <p role="alert" className="text-xs text-red-500">{errors.password.message}</p>}
              {pwdError && <p role="alert" className="text-xs text-red-500">{pwdError}</p>}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label>Rol <span className="text-racing" aria-hidden>*</span></Label>
                <Controller
                  name="rolId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value ? String(field.value) : ''}
                      onValueChange={(v) => field.onChange(Number(v))}
                    >
                      <SelectTrigger className="bg-[#F9FAFB] border-[#D1D5DB] text-[#111111]" aria-invalid={!!errors.rolId}>
                        <SelectValue placeholder="Selecciona un rol…" />
                      </SelectTrigger>
                      <SelectContent>
                        {ROL_OPTIONS.map((r) => (
                          <SelectItem key={r.id} value={String(r.id)}>{r.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.rolId && <p role="alert" className="text-xs text-red-500">{errors.rolId.message}</p>}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Sucursal</Label>
                <Controller
                  name="sucursalId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value ? String(field.value) : 'ninguna'}
                      onValueChange={(v) => field.onChange(v === 'ninguna' ? undefined : Number(v))}
                    >
                      <SelectTrigger className="bg-[#F9FAFB] border-[#D1D5DB] text-[#111111]">
                        <SelectValue placeholder="Sin sucursal" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ninguna">Sin sucursal</SelectItem>
                        {sucursales.map((s) => (
                          <SelectItem key={s.id} value={String(s.id)}>{s.nombre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setModalOpen(false)}
                className="bg-white border border-[#D1D5DB] text-[#374151] hover:bg-gray-50"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={guardando}>
                {guardando
                  ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  : editando ? 'Guardar cambios' : 'Crear empleado'
                }
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmación para desactivar */}
      <Dialog open={!!confirmDes} onOpenChange={() => setConfirmDes(null)}>
        <DialogContent className="bg-white text-[#111111] max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-[#111111]">Desactivar empleado</DialogTitle>
            <DialogDescription className="text-[#666666]">
              ¿Confirmas desactivar a{' '}
              <strong className="text-[#111111]">{confirmDes?.nombre}</strong>?
              {' '}El empleado no podrá iniciar sesión hasta ser reactivado.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setConfirmDes(null)}
              className="bg-white border border-[#D1D5DB] text-[#374151] hover:bg-gray-50"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              className="bg-[#CC0000] hover:bg-[#AA0000] text-white"
              disabled={desactivando}
              onClick={confirmarDesactivar}
            >
              {desactivando
                ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                : 'Desactivar'
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
