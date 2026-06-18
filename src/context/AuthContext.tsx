import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'

import type { IdentityType } from '../types'

interface User {
  id: number
  nickname: string
  phone: string
  identity_type: IdentityType
}

interface AuthState {
  user: User | null
  token: string | null
  loading: boolean
}

interface AuthContextValue extends AuthState {
  login: (token: string, user: User) => void
  logout: () => void
  updateUser: (user: Partial<User>) => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function getStoredAuth(): { token: string | null; user: User | null } {
  try {
    const token = localStorage.getItem('token')
    const userStr = localStorage.getItem('user')
    const user = userStr ? JSON.parse(userStr) : null
    return { token, user }
  } catch {
    return { token: null, user: null }
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Initialize from localStorage and verify token
  useEffect(() => {
    const stored = getStoredAuth()
    if (stored.token) {
      setToken(stored.token)
      setUser(stored.user)
      // Verify token validity
      fetch('/api/auth/profile', {
        headers: { Authorization: `Bearer ${stored.token}` },
      })
        .then(res => {
          if (!res.ok) throw new Error('Token invalid')
          return res.json()
        })
        .then(data => {
          setUser(data.user)
          localStorage.setItem('user', JSON.stringify(data.user))
        })
        .catch(() => {
          // Token expired or invalid
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          setToken(null)
          setUser(null)
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = useCallback((newToken: string, newUser: User) => {
    localStorage.setItem('token', newToken)
    localStorage.setItem('user', JSON.stringify(newUser))
    setToken(newToken)
    setUser(newUser)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
  }, [])

  const updateUser = useCallback((partial: Partial<User>) => {
    setUser(prev => {
      if (!prev) return prev
      const updated = { ...prev, ...partial }
      localStorage.setItem('user', JSON.stringify(updated))
      return updated
    })
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
