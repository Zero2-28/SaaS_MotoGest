import prisma from "../lib/prisma";
import { AppError } from "../lib/appError";

// Campos seleccionados para respuestas públicas (excluye precioCompra)
const selectPublico = {
  id: true,
  codigo: true,
  nombre: true,
  descripcion: true,
  imagen_url: true,
  precioVenta: true,
  activo: true,
  createdAt: true,
  updatedAt: true,
  categoriaId: true,
  categoria: true,
} as const;

export const listProductosService = async (input: {
  page: number;
  limit: number;
  search?: string;
  categoriaId?: number;
  activo?: boolean;
}) => {
  const { page, limit, search, categoriaId, activo } = input;
  const where = {
    // Si activo es undefined → default true (catálogo público solo ve activos)
    activo: activo ?? true,
    ...(categoriaId ? { categoriaId } : {}),
    ...(search
      ? {
          OR: [
            { nombre: { contains: search, mode: "insensitive" as const } },
            { codigo: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [total, items] = await Promise.all([
    prisma.producto.count({ where }),
    prisma.producto.findMany({
      where,
      orderBy: { id: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: selectPublico,
    }),
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

export const getProductoByIdService = async (id: number) => {
  const producto = await prisma.producto.findFirst({
    where: { id, activo: true },
    select: {
      ...selectPublico,
      // Incluye stock de la sucursal principal (id=1) para mostrar disponibilidad al cliente
      inventarioSucursal: {
        where: { sucursalId: 1 },
        select: { cantidad: true },
        take: 1,
      },
    },
  });

  if (!producto) {
    throw new AppError("Producto no encontrado", 404);
  }

  const { inventarioSucursal, ...rest } = producto;
  return { ...rest, stock: inventarioSucursal[0]?.cantidad };
};

export const createProductoService = async (data: {
  codigo: string;
  nombre: string;
  descripcion?: string;
  imagen_url?: string | null;
  categoriaId: number;
  precioCompra: number;
  precioVenta: number;
}): Promise<unknown> => {
  const producto = await prisma.producto.create({
    data: {
      codigo: data.codigo,
      nombre: data.nombre,
      descripcion: data.descripcion,
      imagen_url: data.imagen_url,
      categoriaId: data.categoriaId,
      precioCompra: data.precioCompra,
      precioVenta: data.precioVenta,
    },
  });

  return producto;
};

export const updateProductoService = async (input: {
  id: number;
  data: {
    codigo?: string;
    nombre?: string;
    descripcion?: string;
    imagen_url?: string | null;
    categoriaId?: number;
    precioCompra?: number;
    precioVenta?: number;
    activo?: boolean;
  };
}): Promise<unknown> => {
  const exists = await prisma.producto.findUnique({ where: { id: input.id } });
  if (!exists) {
    throw new AppError("Producto no encontrado", 404);
  }

  const updated = await prisma.producto.update({
    where: { id: input.id },
    data: {
      codigo: input.data.codigo,
      nombre: input.data.nombre,
      descripcion: input.data.descripcion,
      imagen_url: input.data.imagen_url,
      categoriaId: input.data.categoriaId,
      precioCompra: input.data.precioCompra,
      precioVenta: input.data.precioVenta,
      activo: input.data.activo,
    },
  });

  return updated;
};

export const deleteProductoService = async (id: number): Promise<unknown> => {
  const exists = await prisma.producto.findUnique({ where: { id } });
  if (!exists) {
    throw new AppError("Producto no encontrado", 404);
  }

  const updated = await prisma.producto.update({
    where: { id },
    data: { activo: false },
  });

  return updated;
};
