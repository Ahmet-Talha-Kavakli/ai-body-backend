export function mapApiError(error: any): {
  title: string
  message: string
  isRetryable: boolean
} {
  const status = error.status || 500

  if (status === 401) {
    return {
      title: 'Authentication Failed',
      message: 'Please sign in again',
      isRetryable: false,
    }
  }

  if (status >= 500) {
    return {
      title: 'Server Error',
      message: 'Something went wrong. Please try again.',
      isRetryable: true,
    }
  }

  return {
    title: 'Error',
    message: error.message || 'An unexpected error occurred',
    isRetryable: true,
  }
}
