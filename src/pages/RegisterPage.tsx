import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { authService } from '../services/authService'
import type { IdentityType } from '../types'

export default function RegisterPage() {
  const { login } = useAuth()
  const navigate = useNavigate()

  // 步骤控制：step1=选身份，step2=填写信息
  const [step, setStep] = useState<1 | 2>(1)
  const [identityType, setIdentityType] = useState<IdentityType | null>(null)

  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleIdentitySelect(type: IdentityType) {
    setIdentityType(type)
  }

  function handleNextStep() {
    if (!identityType) {
      setError('请选择您的身份')
      return
    }
    setError('')
    setStep(2)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!/^\d{11}$/.test(phone)) {
      setError('请输入正确的手机号')
      return
    }
    if (password.length < 6) {
      setError('密码至少6位')
      return
    }
    if (password !== confirmPassword) {
      setError('两次密码输入不一致')
      return
    }

    setError('')
    setLoading(true)

    if (!nickname.trim()) {
      setError('请填写真实姓名')
      setLoading(false)
      return
    }

    try {
      const data = await authService.register(phone, password, nickname.trim(), identityType || 'student')
      login(data.token, data.user)
      navigate('/select', { replace: true })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '注册失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">注册</h1>
          <p className="text-gray-500 mt-2">
            {step === 1 ? '选择您的身份，开启专属测评之旅' : '创建账号，记录您的每一次成长'}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-6">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-xl text-sm text-center">
              {error}
            </div>
          )}

          {/* ========== Step 1: 身份选择 ========== */}
          {step === 1 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-4 text-center">我是：</p>
              <div className="space-y-3 mb-6">
                {/* 大学生选项 */}
                <button
                  type="button"
                  onClick={() => handleIdentitySelect('student')}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                    identityType === 'student'
                      ? 'border-purple-500 bg-purple-50 shadow-sm'
                      : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🎓</span>
                    <div>
                      <h3 className="font-bold text-gray-800 text-sm">大学生</h3>
                      <p className="text-xs text-gray-500 mt-0.5">正在寻找适合的行业方向与岗位</p>
                    </div>
                    {identityType === 'student' && (
                      <span className="ml-auto text-purple-500 text-lg">✓</span>
                    )}
                  </div>
                </button>

                {/* 企业二代选项 */}
                <button
                  type="button"
                  onClick={() => handleIdentitySelect('successor')}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                    identityType === 'successor'
                      ? 'border-purple-500 bg-purple-50 shadow-sm'
                      : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🏢</span>
                    <div>
                      <h3 className="font-bold text-gray-800 text-sm">企业二代</h3>
                      <p className="text-xs text-gray-500 mt-0.5">面临继承 / 创业 / 就业的抉择</p>
                    </div>
                    {identityType === 'successor' && (
                      <span className="ml-auto text-purple-500 text-lg">✓</span>
                    )}
                  </div>
                </button>
              </div>

              <button
                type="button"
                onClick={handleNextStep}
                disabled={!identityType}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                下一步
              </button>

              <p className="mt-6 text-center text-sm text-gray-500">
                已有账号？
                <Link to="/login" className="text-purple-600 hover:text-purple-700 font-medium ml-1">
                  立即登录
                </Link>
              </p>
            </div>
          )}

          {/* ========== Step 2: 填写信息 ========== */}
          {step === 2 && (
            <div>
              {/* 已选身份提示 */}
              <div className="mb-4 bg-purple-50 border border-purple-100 rounded-xl px-4 py-2 flex items-center justify-between">
                <span className="text-sm text-purple-700">
                  {identityType === 'student' ? '🎓 大学生' : '🏢 企业二代'}
                </span>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs text-purple-500 hover:text-purple-700 underline"
                >
                  修改
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">手机号</label>
                  <input
                    type="tel"
                    maxLength={11}
                    value={phone}
                    onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="请输入手机号"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-200 outline-none transition-all text-sm"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="至少6位密码"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-200 outline-none transition-all text-sm"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">确认密码</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="再次输入密码"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-200 outline-none transition-all text-sm"
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">真实姓名 <span className="text-red-400">*</span></label>
                  <input
                    type="text"
                    maxLength={50}
                    required
                    value={nickname}
                    onChange={e => setNickname(e.target.value)}
                    placeholder="请输入真实姓名"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-200 outline-none transition-all text-sm"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium transition-all duration-200 disabled:opacity-50"
                >
                  {loading ? '注册中…' : '注册'}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-gray-500">
                已有账号？
                <Link to="/login" className="text-purple-600 hover:text-purple-700 font-medium ml-1">
                  立即登录
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
