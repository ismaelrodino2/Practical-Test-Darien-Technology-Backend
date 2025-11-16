export type HttpError = Error & { statusCode: number };

export function createHttpError(
  message: string,
  statusCode = 500,
): HttpError {
  const error = new Error(message) as HttpError;
  error.name = "HttpError";
  error.statusCode = statusCode;
  return error;
}

export function isHttpError(error: unknown): error is HttpError {
  return (
    error instanceof Error &&
    typeof (error as Partial<HttpError>).statusCode === "number"
  );
}