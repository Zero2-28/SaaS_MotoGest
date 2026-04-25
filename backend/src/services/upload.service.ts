import { supabase } from "../config/supabase";
import { AppError } from "../lib/appError";

const BUCKET_PRODUCTOS = "motogest-productos";
const BUCKET_CATEGORIAS = "motogest-categorias";
const BUCKET_AVATARES = "motogest-avatares";

async function uploadToSupabase(
  bucket: string,
  file: Buffer,
  filename: string,
  mimeType: string
): Promise<string> {
  const { error } = await supabase.storage
    .from(bucket)
    .upload(filename, file, { contentType: mimeType, upsert: true });

  if (error) {
    throw new AppError(`Error al subir imagen: ${error.message}`, 500);
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(filename);
  return data.publicUrl;
}

export async function uploadProductoImage(
  file: Buffer,
  filename: string,
  mimeType: string
): Promise<string> {
  return uploadToSupabase(BUCKET_PRODUCTOS, file, filename, mimeType);
}

export async function uploadCategoriaImage(
  file: Buffer,
  filename: string,
  mimeType: string
): Promise<string> {
  return uploadToSupabase(BUCKET_CATEGORIAS, file, filename, mimeType);
}

export async function uploadAvatarImage(
  file: Buffer,
  filename: string,
  mimeType: string
): Promise<string> {
  return uploadToSupabase(BUCKET_AVATARES, file, filename, mimeType);
}
