import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

const requireEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Falta variable de entorno: ${key}`);
  }
  return value;
};

const getOrCreateSucursal = async (): Promise<{ id: number }> => {
  const nombre = process.env.SEED_SUCURSAL_NOMBRE || "Sucursal Principal";
  const ubicacion = process.env.SEED_SUCURSAL_UBICACION || "Ayacucho";
  const telefono = process.env.SEED_SUCURSAL_TELEFONO || null;

  const existing = await prisma.sucursal.findFirst({ where: { nombre } });
  if (existing) {
    return { id: existing.id };
  }

  const created = await prisma.sucursal.create({
    data: { nombre, ubicacion, telefono },
  });

  return { id: created.id };
};

const getOrCreateRoles = async (): Promise<void> => {
  const roles = ["admin", "vendedor", "repartidor"] as const;
  await Promise.all(
    roles.map((name) =>
      prisma.role.upsert({
        where: { name },
        update: {},
        create: { name },
      })
    )
  );
};

const getRoleId = async (name: "admin" | "vendedor"): Promise<number> => {
  const role = await prisma.role.findUnique({ where: { name } });
  if (!role) {
    throw new Error(`Rol no encontrado: ${name}`);
  }
  return role.id;
};

const upsertUsuario = async (input: {
  nombre: string;
  email: string;
  password: string;
  rolId: number;
  sucursalId?: number | null;
}): Promise<void> => {
  const passwordHash = await bcrypt.hash(input.password, 10);

  await prisma.usuario.upsert({
    where: { email: input.email },
    update: {
      nombre: input.nombre,
      password: passwordHash,
      rolId: input.rolId,
      sucursalId: input.sucursalId ?? null,
      activo: true,
    },
    create: {
      nombre: input.nombre,
      email: input.email,
      password: passwordHash,
      rolId: input.rolId,
      sucursalId: input.sucursalId ?? null,
      activo: true,
    },
  });
};

const seedCategorias = async (): Promise<void> => {
  const categorias = [
    process.env.SEED_CATEGORIA_1 || "Cascos",
    process.env.SEED_CATEGORIA_2 || "Guantes",
    process.env.SEED_CATEGORIA_3 || "Espejos",
  ];
  await Promise.all(
    categorias.map((nombre) =>
      prisma.categoria.upsert({
        where: { nombre },
        update: {},
        create: { nombre },
      })
    )
  );
};

const seedProveedor = async (): Promise<void> => {
  const nombre = process.env.SEED_PROVEEDOR_NOMBRE || "Proveedor Demo";
  const existing = await prisma.proveedor.findFirst({ where: { nombre } });
  if (!existing) {
    await prisma.proveedor.create({
      data: {
        nombre,
        email: process.env.SEED_PROVEEDOR_EMAIL || "proveedor@demo.com",
        telefono: process.env.SEED_PROVEEDOR_TELEFONO || null,
        contacto: process.env.SEED_PROVEEDOR_CONTACTO || null,
      },
    });
  }
};

const main = async (): Promise<void> => {
  await getOrCreateRoles();
  const { id: sucursalId } = await getOrCreateSucursal();

  const adminEmail = requireEnv("SEED_ADMIN_EMAIL");
  const adminPassword = requireEnv("SEED_ADMIN_PASSWORD");
  const vendedorEmail = requireEnv("SEED_VENDEDOR_EMAIL");
  const vendedorPassword = requireEnv("SEED_VENDEDOR_PASSWORD");

  const adminRolId = await getRoleId("admin");
  const vendedorRolId = await getRoleId("vendedor");

  await upsertUsuario({
    nombre: process.env.SEED_ADMIN_NOMBRE || "Administrador",
    email: adminEmail,
    password: adminPassword,
    rolId: adminRolId,
    sucursalId: null,
  });

  await upsertUsuario({
    nombre: process.env.SEED_VENDEDOR_NOMBRE || "Vendedor",
    email: vendedorEmail,
    password: vendedorPassword,
    rolId: vendedorRolId,
    sucursalId,
  });

  await seedCategorias();
  await seedProveedor();
};

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error("Error en seed:", error);
    await prisma.$disconnect();
    process.exit(1);
  });
