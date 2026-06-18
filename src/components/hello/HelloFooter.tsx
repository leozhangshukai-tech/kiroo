import { motion } from 'framer-motion'

const footerLinks = [
  {
    title: '产品',
    links: ['学生版测评', '企业二代版测评', '报告示例', '常见问题'],
  },
  {
    title: '关于',
    links: ['专家团队', '科学依据', '用户故事', '联系我们'],
  },
  {
    title: '支持',
    links: ['使用指南', '隐私政策', '用户协议', '合作洽谈'],
  },
]

export default function HelloFooter() {
  return (
    <motion.footer
      id="footer"
      className="bg-[#0F172A] text-white pt-16 pb-8 px-4 sm:px-6 lg:px-8"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* 品牌 */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#2563EB] to-[#06B6D4] flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.674M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <span className="text-lg font-bold">明途AI</span>
            </div>
            <p className="text-sm text-white/50 leading-relaxed mb-4">
              看清前途，再做选择
            </p>
            <p className="text-xs text-white/30">
              权威专家设计测评 × AI智能分析<br />
              帮你找到最适合的发展方向
            </p>
          </div>

          {/* 链接列 */}
          {footerLinks.map((group) => (
            <div key={group.title}>
              <h4 className="text-sm font-semibold text-white/80 mb-4">{group.title}</h4>
              <ul className="space-y-2.5">
                {group.links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-white/40 hover:text-white/80 transition-colors duration-200">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* 分割线 */}
        <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/30">
            © 2026 明途AI · All Rights Reserved
          </p>
          <p className="text-xs text-white/30">
            测一次，少走五年弯路
          </p>
        </div>
      </div>
    </motion.footer>
  )
}
