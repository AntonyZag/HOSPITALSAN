export interface ValidationErrorDetail {
  msg?: string;
  loc?: Array<string | number>;
}

export interface ApiError {
  detail: string | ValidationErrorDetail[];
}
