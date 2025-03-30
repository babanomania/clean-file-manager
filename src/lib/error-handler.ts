export class AppError extends Error {
  public code: string
  public httpStatus: number

  constructor(message: string, code: string, httpStatus: number = 500) {
    super(message)
    this.code = code
    this.httpStatus = httpStatus
    this.name = 'AppError'
  }
}

export const ErrorCodes = {
  // Auth Errors
  AUTH_INVALID_CREDENTIALS: 'auth/invalid-credentials',
  AUTH_EMAIL_IN_USE: 'auth/email-in-use',
  AUTH_WEAK_PASSWORD: 'auth/weak-password',
  AUTH_UNAUTHORIZED: 'auth/unauthorized',
  
  // File Errors
  FILE_TOO_LARGE: 'file/too-large',
  FILE_INVALID_TYPE: 'file/invalid-type',
  FILE_NOT_FOUND: 'file/not-found',
  FILE_UPLOAD_FAILED: 'file/upload-failed',
  FILE_DOWNLOAD_FAILED: 'file/download-failed',
  FILE_DELETE_FAILED: 'file/delete-failed',
  
  // Share Errors
  SHARE_LINK_EXPIRED: 'share/link-expired',
  SHARE_INVALID_PASSWORD: 'share/invalid-password',
  SHARE_NOT_FOUND: 'share/not-found',
  
  // Backup Errors
  BACKUP_IN_PROGRESS: 'backup/in-progress',
  BACKUP_FAILED: 'backup/failed',
  
  // General Errors
  NETWORK_ERROR: 'general/network-error',
  SERVER_ERROR: 'general/server-error',
  UNKNOWN_ERROR: 'general/unknown-error'
} as const

export function handleError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error
  }

  // Handle Supabase errors
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = (error as { code: string }).code
    switch (code) {
      case 'auth/invalid-email':
      case 'auth/wrong-password':
        return new AppError('Invalid email or password', ErrorCodes.AUTH_INVALID_CREDENTIALS, 401)
      case 'auth/email-already-in-use':
        return new AppError('Email already in use', ErrorCodes.AUTH_EMAIL_IN_USE, 400)
      case '23505': // Supabase unique constraint violation
        return new AppError('Resource already exists', ErrorCodes.AUTH_EMAIL_IN_USE, 400)
      case 'storage/object-not-found':
        return new AppError('File not found', ErrorCodes.FILE_NOT_FOUND, 404)
      default:
        return new AppError('An unexpected error occurred', ErrorCodes.UNKNOWN_ERROR, 500)
    }
  }

  // Handle network errors
  if (error instanceof TypeError && error.message === 'Failed to fetch') {
    return new AppError('Network error. Please check your connection.', ErrorCodes.NETWORK_ERROR, 503)
  }

  // Handle unknown errors
  return new AppError(
    'An unexpected error occurred',
    ErrorCodes.UNKNOWN_ERROR,
    500
  )
}

export function getErrorMessage(error: unknown): string {
  const appError = handleError(error)
  return appError.message
}
