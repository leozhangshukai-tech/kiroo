import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  // 首页使用独立导航栏，隐藏全局Navbar
  if (location.pathname === '/') return null

  function handleLogout() {
    logout()
    setMenuOpen(false)
    navigate('/', { replace: true })
  }

  // 登录后的菜单内容
  const userMenu = (
    <>
      {menuOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
          <div className="absolute right-0 top-12 w-48 bg-white rounded-xl shadow-lg border border-black/[0.04] py-1 z-50">
            <div className="px-4 py-2 border-b border-gray-100">
              <p className="text-sm font-medium text-[#1a1a2e]">{user?.nickname}</p>
              <p className="text-xs text-gray-400">{user?.phone}</p>
            </div>
            <Link
              to="/history"
              onClick={() => setMenuOpen(false)}
              className="block px-4 py-2 text-sm text-gray-600 hover:bg-indigo-50 hover:text-indigo-600"
            >
              我的测评
            </Link>
            <Link
              to="/profile"
              onClick={() => setMenuOpen(false)}
              className="block px-4 py-2 text-sm text-gray-600 hover:bg-indigo-50 hover:text-indigo-600"
            >
              个人中心
            </Link>
            <button
              onClick={handleLogout}
              className="block w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50"
            >
              退出登录
            </button>
          </div>
        </>
      )}
    </>
  )

  return (
    <nav className="bg-white border-b border-black/[0.04] sticky top-0 z-50">
      <div className="mx-auto px-4 md:px-10 h-14 flex items-center justify-between max-w-6xl">
        <Link to="/" className="text-lg font-bold text-[#1a1a2e] hover:text-indigo-600 transition-colors flex-shrink-0">
          AI 测评
        </Link>

        {/* 桌面端：完整导航 */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-gray-50 transition-colors text-sm"
              >
                <span className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold">
                  {user.nickname.charAt(0)}
                </span>
                <span className="text-[#1a1a2e] font-medium">{user.nickname}</span>
              </button>
              {userMenu}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="px-4 py-1.5 rounded-full text-sm font-medium text-indigo-600 hover:bg-indigo-50 transition-colors">
                登录
              </Link>
              <Link to="/register" className="px-5 py-1.5 rounded-full text-sm font-bold bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white shadow-[0_3px_10px_rgba(99,102,241,0.2)] transition-all">
                注册
              </Link>
            </div>
          )}
        </div>

        {/* 移动端：仅头像 + 下拉菜单 */}
        <div className="flex md:hidden items-center gap-2">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold shadow-sm"
              >
                {user.nickname.charAt(0)}
              </button>
              {userMenu}
            </div>
          ) : (
            <Link
              to="/login"
              className="px-4 py-1.5 rounded-full text-sm font-bold bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-sm"
            >
              登录
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
