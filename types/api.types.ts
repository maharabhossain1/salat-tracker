export type ApiError = {
  error: string;
  code: string;
};

export type ApiResponse<T> = { data: T; error?: never } | { data?: never; error: string };
