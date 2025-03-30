import React from 'react'
import { render as rtlRender } from '@testing-library/react'
import { vi } from 'vitest'

// Mock AuthProvider
const MockAuthProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>
}

// Mock auth context
vi.mock('@/contexts/auth-context', () => ({
  AuthProvider: MockAuthProvider,
  useAuth: () => ({
    user: { id: 'user-1', email: 'test@example.com' },
    loading: false,
    signIn: vi.fn(),
    signOut: vi.fn(),
  }),
}))

function render(ui: React.ReactElement, { ...renderOptions } = {}) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return <MockAuthProvider>{children}</MockAuthProvider>
  }
  return rtlRender(ui, { wrapper: Wrapper, ...renderOptions })
}

// Re-export everything
export * from '@testing-library/react'

// Override render method
export { render }
