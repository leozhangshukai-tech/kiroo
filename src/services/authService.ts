const API_BASE = '/api/auth'

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('token')
  return token
    ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
    : { 'Content-Type': 'application/json' }
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: { ...authHeaders(), ...((options.headers as Record<string, string>) || {}) },
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.error || '请求失败')
  }
  return data as T
}

interface AuthResponse {
  token: string
  user: { id: number; nickname: string; phone: string; identity_type: 'student' | 'successor' }
}

export const authService = {
  register(phone: string, password: string, nickname?: string, identity_type?: string) {
    return request<AuthResponse>('/register', {
      method: 'POST',
      body: JSON.stringify({ phone, password, nickname, identity_type }),
    })
  },

  loginByPassword(phone: string, password: string) {
    return request<AuthResponse>('/login/password', {
      method: 'POST',
      body: JSON.stringify({ phone, password }),
    })
  },

  sendCode(phone: string) {
    return request<{ message: string }>('/send-code', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    })
  },

  loginByPhone(phone: string, code: string) {
    return request<AuthResponse>('/login/phone', {
      method: 'POST',
      body: JSON.stringify({ phone, code }),
    })
  },

  getProfile() {
    return request<{ user: { id: number; nickname: string; phone: string; created_at: string } }>('/profile')
  },

  updatePassword(oldPassword: string, newPassword: string) {
    return request<{ message: string }>('/update-password', {
      method: 'POST',
      body: JSON.stringify({ oldPassword, newPassword }),
    })
  },

  updateNickname(nickname: string) {
    return request<{ message: string; token: string; nickname: string }>('/update-nickname', {
      method: 'POST',
      body: JSON.stringify({ nickname }),
    })
  },

  updateIdentity(identity_type: 'student' | 'successor') {
    return request<{ message: string; identity_type: string }>('/update-identity', {
      method: 'POST',
      body: JSON.stringify({ identity_type }),
    })
  },
}
