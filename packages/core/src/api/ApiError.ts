import type { ApiErrorCode } from "./ApiErrorCode";

// Los errores viajan siempre con esta forma, nunca como excepcion sin estructura
export interface ApiError {
  readonly code: ApiErrorCode;
  readonly message: string;
}
