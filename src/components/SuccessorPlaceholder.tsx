import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Construction, ArrowRight, History, UserCircle } from 'lucide-react'

export default function SuccessorPlaceholder() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50 flex items-center justify-center px-4">
      <motion.div
        className="max-w-md w-full bg-white rounded-2xl shadow-xl shadow-gray-200/40 p-8 text-center"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        {/* 动画图标 */}
        <motion.div
          className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-amber-50 flex items-center justify-center"
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Construction className="w-10 h-10 text-amber-500" strokeWidth={1.5} />
        </motion.div>

        <motion.h1
          className="text-2xl font-bold text-[#0F172A] mb-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          系统正在完善中
        </motion.h1>

        <motion.p
          className="text-sm text-[#64748B] leading-relaxed mb-8"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
        >
          企业二代测评系统正在紧锣密鼓地开发中，<br />
          我们将为您提供专属的继承/创业/就业全方位评估服务。<br />
          敬请期待！
        </motion.p>

        <motion.div
          className="space-y-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <Link
            to="/history"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-medium text-sm shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all"
          >
            <History className="w-4 h-4" />
            查看历史报告
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/profile"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-gray-200 text-[#64748B] font-medium text-sm hover:border-indigo-300 hover:text-indigo-600 transition-all"
          >
            <UserCircle className="w-4 h-4" />
            个人中心
          </Link>
        </motion.div>

        <motion.p
          className="text-xs text-gray-400 mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.5 }}
        >
          如有疑问，请联系客服
        </motion.p>
      </motion.div>
    </div>
  )
}
