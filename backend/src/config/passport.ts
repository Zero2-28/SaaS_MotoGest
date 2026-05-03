import passport from "passport";
import {
  Strategy as GoogleStrategy,
  Profile,
  VerifyCallback,
} from "passport-google-oauth20";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import prisma from "../lib/prisma";

// Emails autorizados para login con Google como empleado/admin
const EMAILS_PERMITIDOS_ADMIN: string[] = [
  'email_admin_future@gmail.com',
  'email_vendedor_future@gmail.com',
  'robertos@gmail.com',
  // Agregar más emails aquí cuando sea necesario
]

// ── Estrategia 1: Empleados ───────────────────────────────────────────────────
// Solo vincula si el email ya existe en la tabla usuarios.
// Los empleados NO se auto-registran — solo el admin puede crearlos.

passport.use(
  "google",
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      callbackURL: process.env.GOOGLE_CALLBACK_URL ?? "",
    },
    (_accessToken: string, _refreshToken: string, profile: Profile, done: VerifyCallback) => {
      const verify = async () => {
        const email = profile.emails?.[0]?.value;
        if (!email) {
          done(null, false);
          return;
        }

        if (!EMAILS_PERMITIDOS_ADMIN.includes(email)) {
          done(null, false);
          return;
        }

        // Buscar por google_id (ya vinculado anteriormente)
        let usuario = await prisma.usuario.findUnique({
          where: { google_id: profile.id },
        });

        if (!usuario) {
          // Primer login con Google — buscar por email
          const porEmail = await prisma.usuario.findUnique({ where: { email } });

          if (!porEmail) {
            // El email no existe: empleados no pueden auto-registrarse
            done(null, false);
            return;
          }

          // Vincular google_id al empleado existente
          usuario = await prisma.usuario.update({
            where: { id: porEmail.id },
            data: {
              google_id: profile.id,
              avatar_url: profile.photos?.[0]?.value ?? null,
            },
          });
        }

        if (!usuario.activo) {
          done(null, false);
          return;
        }

        done(null, usuario);
      };

      verify().catch((err: Error) => done(err));
    }
  )
);

// ── Estrategia 2: Clientes ────────────────────────────────────────────────────
// Si el email existe → vincula google_id.
// Si no existe → crea el cliente automáticamente.

passport.use(
  "google-cliente",
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      callbackURL: process.env.GOOGLE_CLIENTE_CALLBACK_URL ?? "",
    },
    (_accessToken: string, _refreshToken: string, profile: Profile, done: VerifyCallback) => {
      const verify = async () => {
        const email = profile.emails?.[0]?.value ?? null;
        const nombre = profile.displayName || "Usuario Google";
        const avatarUrl = profile.photos?.[0]?.value ?? null;

        // Buscar por google_id (ya vinculado)
        let cliente = await prisma.cliente.findUnique({
          where: { google_id: profile.id },
        });

        if (!cliente) {
          if (email) {
            // Buscar por email para vincular cuenta existente
            const porEmail = await prisma.cliente.findUnique({ where: { email } });

            if (porEmail) {
              cliente = await prisma.cliente.update({
                where: { id: porEmail.id },
                data: {
                  google_id: profile.id,
                  avatar_url: avatarUrl,
                },
              });
            }
          }

          if (!cliente) {
            // Crear nuevo cliente con password aleatorio (no se usará para login normal)
            const tempPassword = crypto.randomBytes(16).toString("hex");
            const passwordHash = await bcrypt.hash(tempPassword, 10);

            cliente = await prisma.cliente.create({
              data: {
                nombre,
                email,
                password: passwordHash,
                google_id: profile.id,
                avatar_url: avatarUrl,
              },
            });
          }
        }

        done(null, cliente);
      };

      verify().catch((err: Error) => done(err));
    }
  )
);

export default passport;
