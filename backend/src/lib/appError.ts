export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

export const toAppError = (error: unknown): AppError => {
  if (error instanceof AppError) return error;
  if (error instanceof Error) return new AppError(error.message, 500);
  return new AppError("Error interno servidor", 500);
};
