import { Request, Response } from "express";
import multer from "multer";
import path from "path";
import { uploadProductoImage, uploadCategoriaImage, uploadAvatarImage } from "../services/upload.service";
import { AuthRequest } from "../middlewares/auth.middleware";
import { toAppError } from "../lib/appError";

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
}

const sendSuccess = <T>(res: Response, data: T, statusCode = 200): void => {
  res.status(statusCode).json({ success: true, data } as ApiResponse<T>);
};

const sendError = (res: Response, message: string, statusCode = 400): void => {
  res.status(statusCode).json({ success: false, message } as ApiResponse);
};

// Almacenamiento en memoria para no escribir en disco
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      cb(new Error("Solo se permiten imágenes"));
      return;
    }
    cb(null, true);
  },
});

function buildFilename(originalName: string): string {
  const ext = path.extname(originalName).toLowerCase();
  const base = path
    .basename(originalName, ext)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .slice(0, 60);
  return `${base}-${Date.now()}${ext}`;
}

export const uploadProducto = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.file) {
      sendError(res, "No se recibió ningún archivo");
      return;
    }
    const filename = buildFilename(req.file.originalname);
    const url = await uploadProductoImage(
      req.file.buffer,
      filename,
      req.file.mimetype
    );
    sendSuccess(res, { url });
  } catch (error: unknown) {
    const appError = toAppError(error);
    sendError(res, appError.message, appError.statusCode);
  }
};

export const uploadCategoria = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.file) {
      sendError(res, "No se recibió ningún archivo");
      return;
    }
    const filename = buildFilename(req.file.originalname);
    const url = await uploadCategoriaImage(
      req.file.buffer,
      filename,
      req.file.mimetype
    );
    sendSuccess(res, { url });
  } catch (error: unknown) {
    const appError = toAppError(error);
    sendError(res, appError.message, appError.statusCode);
  }
};

export const uploadAvatar = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.file) {
      sendError(res, "No se recibió ningún archivo");
      return;
    }
    const filename = buildFilename(req.file.originalname);
    const url = await uploadAvatarImage(
      req.file.buffer,
      filename,
      req.file.mimetype
    );
    sendSuccess(res, { url });
  } catch (error: unknown) {
    const appError = toAppError(error);
    sendError(res, appError.message, appError.statusCode);
  }
};
