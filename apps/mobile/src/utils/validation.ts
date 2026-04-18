export function validateEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

export function validatePassword(password: string): {
  isValid: boolean
  strength?: string
  errors?: string[]
} {
  const errors: string[] = []

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters')
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain an uppercase letter')
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain a lowercase letter')
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain a number')
  }

  return {
    isValid: errors.length === 0,
    strength: password.length >= 12 ? 'strong' : password.length >= 8 ? 'medium' : 'weak',
    errors,
  }
}

export function validateForm(data: any, requiredFields: string[]): Record<string, string> {
  const errors: Record<string, string> = {}
  requiredFields.forEach((field) => {
    if (!data[field]) errors[field] = `${field} is required`
  })
  return errors
}

export function validateOnboardingStep(step: number, data: any): Record<string, string> {
  const errors: Record<string, string> = {}

  switch (step) {
    case 1:
      if (!data.goalType) {
        errors.goalType = 'Please select a fitness goal'
      }
      break
    case 2:
      if (!data.name || data.name.length < 2) {
        errors.name = 'Name must be at least 2 characters'
      }
      if (!data.age || isNaN(parseInt(data.age))) {
        errors.age = 'Please enter a valid age'
      }
      break
    case 3:
      if (!data.height || isNaN(parseFloat(data.height))) {
        errors.height = 'Please enter a valid height'
      }
      if (!data.weight || isNaN(parseFloat(data.weight))) {
        errors.weight = 'Please enter a valid weight'
      }
      break
    case 4:
      if (!data.activityLevel) {
        errors.activityLevel = 'Please select an activity level'
      }
      break
    case 5:
      // Optional step, no required validations
      break
  }

  return errors
}
