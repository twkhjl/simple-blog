export interface ApiErrorBody {
  success: false
  error: {
    code: string
    message: string
  }
}

export interface ApiSuccessBody<T> {
  success: true
  data: T
}

export function ok<T>(data: T, status = 200): Response {
  return Response.json(
    {
      success: true,
      data,
    } satisfies ApiSuccessBody<T>,
    { status },
  )
}

export function fail(code: string, message: string, status: number): Response {
  return Response.json(
    {
      success: false,
      error: {
        code,
        message,
      },
    } satisfies ApiErrorBody,
    { status },
  )
}

