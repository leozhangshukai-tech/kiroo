import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  parseReportJSON,
  LZUScoreSection,
  LZULeadershipSection,
  LZUPersonalitySection,
  LZUCreativityBarrierSection,
  LZUImprovementPlanSection,
  LZUCareerSection,
  LZUReportSummary,
} from '../../components/LZUReportSections'

// ==================== Types ====================

interface Stats {
  totalUsers: number
  totalAssessments: number
  todayAssessments: number
  totalReports: number
  pendingReports: number
  questionnaireDistribution: Array<{ id: string; name: string; count: number }>
}

interface ReportItem {
  id: number
  sessionId: number
  comprehensiveScore: number
  reviewStatus: 'pending' | 'approved' | 'rejected'
  reviewComment: string | null
  reviewedAt: string | null
  createdAt: string
  createdAtDisplay?: string
  nickname: string
  phone: string
  orderedQuestionnaires: string[]
  reportType?: 'student' | 'successor'
  reportSerialNo?: number | null
}

interface RankingItem {
  userId: number
  nickname: string
  phone: string | null
  bestScore: number
  assessmentCount: number
  latestAssessmentDate: string
  latestAssessmentDisplay?: string
}

interface ReportDetail {
  id: number
  sessionId: number
  userId: number
  questionnairesCompleted: string[]
  scoreSummary: Record<string, any>
  reportContent: string
  reportHtml: string | null
  docxPath: string | null
  comprehensiveScore: number
  reviewStatus: 'pending' | 'approved' | 'rejected'
  reviewComment: string | null
  reviewedAt: string | null
  createdAt: string
  createdAtDisplay?: string
  nickname: string
  phone: string
  orderedQuestionnaires: string[]
  selectedQuestionnaires: string[]
  assessmentRecords: Array<{
    id: number
    questionnaireId: string
    questionnaireName: string
    scoreResult: Record<string, any>
    createdAt: string
  }>
}

// ==================== Helpers ====================

function adminHeaders(): Record<string, string> {
  const token = localStorage.getItem('admin_token')
  return token
    ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
    : { 'Content-Type': 'application/json' }
}

function getGrade(score: number): { label: string; color: string; bgColor: string } {
  if (score >= 90) return { label: '卓越型', color: 'text-purple-700', bgColor: 'bg-purple-100' }
  if (score >= 75) return { label: '进取型', color: 'text-blue-700', bgColor: 'bg-blue-100' }
  if (score >= 60) return { label: '成长型', color: 'text-green-700', bgColor: 'bg-green-100' }
  return { label: '待发展型', color: 'text-amber-700', bgColor: 'bg-amber-100' }
}

// ==================== Component ====================

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<Stats | null>(null)
  const [reports, setReports] = useState<ReportItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  // Filters
  const [filterStatus, setFilterStatus] = useState('')
  const [filterKeyword, setFilterKeyword] = useState('')
  const [filterReportType, setFilterReportType] = useState('')

  // Detail modal
  const [detailReport, setDetailReport] = useState<ReportDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [reviewLoading, setReviewLoading] = useState(false)
  const [generateLoading, setGenerateLoading] = useState<number | null>(null) // track which report is generating
  const [previewMode, setPreviewMode] = useState<'json' | 'html'>('html') // prefer HTML preview

  // Ranking
  const [ranking, setRanking] = useState<RankingItem[]>([])
  const [rankingLoading, setRankingLoading] = useState(false)

  // Tab: 'reports' | 'ranking' | 'assessments' | 'users'
  const [activeTab, setActiveTab] = useState<'reports' | 'ranking' | 'assessments' | 'users'>('reports')

  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    if (!token) {
      navigate('/admin/login', { replace: true })
      return
    }
    loadStats()
    loadReports(1)
  }, [])

  // 懒加载排名数据
  useEffect(() => {
    if (activeTab === 'ranking' && ranking.length === 0) {
      loadRanking()
    }
  }, [activeTab])

  async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
    const res = await fetch(url, {
      ...options,
      headers: { ...adminHeaders(), ...((options?.headers as Record<string, string>) || {}) },
    })
    if (res.status === 401) {
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_info')
      navigate('/admin/login', { replace: true })
      throw new Error('Unauthorized')
    }
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || '请求失败')
    return data as T
  }

  async function loadStats() {
    try {
      const data = await apiFetch<Stats>('/api/admin/stats')
      setStats(data)
    } catch { /* handled */ }
  }

  async function loadReports(p: number) {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(p))
      params.set('pageSize', '20')
      if (filterStatus) params.set('review_status', filterStatus)
      if (filterKeyword) params.set('keyword', filterKeyword)
      if (filterReportType) params.set('report_type', filterReportType)

      const data = await apiFetch<{ reports: ReportItem[]; total: number }>(
        `/api/admin/reports?${params.toString()}`
      )
      setReports(data.reports)
      setTotal(data.total)
      setPage(p)
    } catch { /* handled */ }
    finally { setLoading(false) }
  }

  async function loadRanking() {
    setRankingLoading(true)
    try {
      const data = await apiFetch<{ ranking: RankingItem[] }>('/api/admin/ranking')
      setRanking(data.ranking)
    } catch { /* handled */ }
    finally { setRankingLoading(false) }
  }

  async function loadDetail(id: number) {
    setDetailLoading(true)
    try {
      const data = await apiFetch<{ report: ReportDetail }>(`/api/admin/reports/${id}`)
      setDetailReport(data.report)
    } catch { /* handled */ }
    finally { setDetailLoading(false) }
  }

  function closeDetail() {
    setDetailReport(null)
  }

  async function handleGenerate(id: number) {
    if (!confirm('确认生成报告？系统将调用AI分析并组装标准化报告模版。')) return
    setGenerateLoading(id)
    try {
      await apiFetch(`/api/admin/reports/${id}/generate`, { method: 'POST' })
      alert('报告生成成功！请查看详情预览。')
      // 重新加载详情
      await loadDetail(id)
      loadReports(page)
    } catch (err: any) {
      alert('生成失败：' + (err.message || '未知错误'))
    } finally {
      setGenerateLoading(null)
    }
  }

  function handleDownload(id: number) {
    const token = localStorage.getItem('admin_token')
    if (!token) return
    // 直接打开下载链接
    const a = document.createElement('a')
    a.href = `/api/admin/reports/${id}/download`
    // 使用fetch方式下载（需要带token）
    fetch(`/api/admin/reports/${id}/download`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(res => {
      if (!res.ok) throw new Error('下载失败')
      return res.blob()
    }).then(blob => {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `人才测评报告_${id}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    }).catch(err => alert('下载失败：' + err.message))
  }

  async function handleApprove(id: number) {
    setReviewLoading(true)
    try {
      await apiFetch(`/api/admin/reports/${id}/approve`, { method: 'POST' })
      setDetailReport(prev => prev ? { ...prev, reviewStatus: 'approved' } : null)
      loadReports(page)
    } catch { /* handled */ }
    finally { setReviewLoading(false) }
  }

  async function handleReject(id: number) {
    const comment = prompt('请输入退回原因（可选）：')
    setReviewLoading(true)
    try {
      await apiFetch(`/api/admin/reports/${id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ comment: comment || undefined }),
      })
      setDetailReport(prev => prev ? { ...prev, reviewStatus: 'rejected', reviewComment: comment || null } : null)
      loadReports(page)
    } catch { /* handled */ }
    finally { setReviewLoading(false) }
  }

  function getQuestionnaireLabel(qid: string): string {
    const labels: Record<string, string> = {
      leadership: '领导风格',
      temperament: '气质类型',
      big5: '大五人格',
      mbti: 'MBTI',
      '16pf': '16PF',
      creativity: '创造力',
      holland: '霍兰德',
    }
    return labels[qid] || qid
  }

  const totalPages = Math.ceil(total / 20)

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-bold text-gray-800">管理后台</h1>
            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('reports')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  activeTab === 'reports' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                综合报告
              </button>
              <button
                onClick={() => setActiveTab('ranking')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  activeTab === 'ranking' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                综合排名
              </button>
              <button
                onClick={() => setActiveTab('assessments')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  activeTab === 'assessments' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                测评记录
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  activeTab === 'users' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                用户管理
              </button>
            </div>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem('admin_token')
              localStorage.removeItem('admin_info')
              navigate('/admin/login', { replace: true })
            }}
            className="text-sm text-gray-500 hover:text-red-500 transition-colors"
          >
            退出
          </button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
            <div className="bg-white rounded-xl shadow-sm p-4">
              <p className="text-gray-400 text-xs mb-1">总用户数</p>
              <p className="text-2xl font-bold text-gray-800">{stats.totalUsers}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4">
              <p className="text-gray-400 text-xs mb-1">总测评数</p>
              <p className="text-2xl font-bold text-gray-800">{stats.totalAssessments}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4">
              <p className="text-gray-400 text-xs mb-1">今日测评</p>
              <p className="text-2xl font-bold text-gray-800">{stats.todayAssessments}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4">
              <p className="text-gray-400 text-xs mb-1">综合报告</p>
              <p className="text-2xl font-bold text-gray-800">{stats.totalReports}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-amber-400">
              <p className="text-gray-400 text-xs mb-1">待审核</p>
              <p className="text-2xl font-bold text-amber-600">{stats.pendingReports}</p>
            </div>
          </div>
        )}

        {/* Filters — only for reports tab */}
        {activeTab === 'reports' && (<>
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-xs text-gray-500 mb-1">报告类型</label>
              <select
                value={filterReportType}
                onChange={e => setFilterReportType(e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-indigo-400 outline-none"
              >
                <option value="">全部</option>
                <option value="student">🎓 学生报告</option>
                <option value="successor">🏢 二代报告</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">审核状态</label>
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-indigo-400 outline-none"
              >
                <option value="">全部</option>
                <option value="pending">待审核</option>
                <option value="approved">已通过</option>
                <option value="rejected">已退回</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">关键词</label>
              <input
                type="text"
                value={filterKeyword}
                onChange={e => setFilterKeyword(e.target.value)}
                placeholder="姓名/手机号"
                className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-indigo-400 outline-none w-36"
              />
            </div>
            <button
              onClick={() => loadReports(1)}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              搜索
            </button>
          </div>
        </div>

        {/* Reports Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">序号</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">用户</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">类型</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">手机号</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">综合得分</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">完成问卷</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">状态</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">时间</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">操作</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9} className="text-center py-10 text-gray-400">加载中…</td>
                  </tr>
                ) : reports.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-10 text-gray-400">暂无数据</td>
                  </tr>
                ) : (
                  reports.map(r => (
                    <tr key={r.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-500">
                        {r.reportSerialNo
                          ? `${r.reportType === 'successor' ? '代' : '学'}-${String(r.reportSerialNo).padStart(3, '0')}`
                          : `#${r.id}`}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${r.reportType === 'successor' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                          {r.reportType === 'successor' ? '二代' : '学生'}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-800">{r.nickname}</td>
                      <td className="px-4 py-3 text-gray-500">{r.phone || '-'}</td>
                      <td className="px-4 py-3">
                        <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-xs font-bold">
                          {r.comprehensiveScore}分
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {r.orderedQuestionnaires?.map(qid => (
                            <span key={qid} className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 text-[10px]">
                              {getQuestionnaireLabel(qid)}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {r.reviewStatus === 'approved' && (
                          <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-medium">已通过</span>
                        )}
                        {r.reviewStatus === 'pending' && (
                          <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-xs font-medium">待审核</span>
                        )}
                        {r.reviewStatus === 'rejected' && (
                          <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs font-medium">已退回</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {r.createdAtDisplay || (r.createdAt ? new Date(r.createdAt).toLocaleString('zh-CN') : '')}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => loadDetail(r.id)}
                          className="text-xs text-indigo-600 hover:text-indigo-800 font-medium hover:underline"
                        >
                          查看详情
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <span className="text-sm text-gray-500">共 {total} 条</span>
              <div className="flex gap-1">
                <button
                  onClick={() => loadReports(page - 1)}
                  disabled={page <= 1}
                  className="px-3 py-1 rounded-lg text-sm border border-gray-200 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  上一页
                </button>
                <span className="px-3 py-1 text-sm text-gray-600">{page} / {totalPages}</span>
                <button
                  onClick={() => loadReports(page + 1)}
                  disabled={page >= totalPages}
                  className="px-3 py-1 rounded-lg text-sm border border-gray-200 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  下一页
                </button>
              </div>
            </div>
          )}
        </div>
        </>)}

        {/* Ranking Table */}
        {activeTab === 'ranking' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-center px-4 py-3 font-medium text-gray-600 w-16">排名</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">用户</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">手机号</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-600">综合得分</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-600">等级</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-600">测评次数</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">最近测评</th>
                  </tr>
                </thead>
                <tbody>
                  {rankingLoading ? (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-gray-400">加载中…</td>
                    </tr>
                  ) : ranking.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-gray-400">暂无排名数据</td>
                    </tr>
                  ) : (
                    ranking.map((item, index) => {
                      const grade = getGrade(item.bestScore)
                      return (
                        <tr key={item.userId} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-3 text-center">
                            {index < 3 ? (
                              <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold text-white ${
                                index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-amber-600'
                              }`}>
                                {index + 1}
                              </span>
                            ) : (
                              <span className="text-gray-400 font-medium">{index + 1}</span>
                            )}
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-800">{item.nickname}</td>
                          <td className="px-4 py-3 text-gray-500">{item.phone || '-'}</td>
                          <td className="px-4 py-3 text-center">
                            <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-xs font-bold">
                              {item.bestScore}分
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${grade.color} ${grade.bgColor}`}>
                              {grade.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center text-gray-500">{item.assessmentCount}次</td>
                          <td className="px-4 py-3 text-gray-400 text-xs">
                            {item.latestAssessmentDisplay
                              || (item.latestAssessmentDate
                                ? new Date(item.latestAssessmentDate).toLocaleString('zh-CN')
                                : '-')}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
            {!rankingLoading && ranking.length > 0 && (
              <div className="px-4 py-3 border-t text-xs text-gray-400">
                共 {ranking.length} 位用户参与排名
              </div>
            )}
          </div>
        )}
      </main>

      {/* Detail Modal */}
      {(detailReport || detailLoading) && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={closeDetail}>
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {detailLoading ? (
              <div className="p-10 text-center text-gray-400">加载中…</div>
            ) : detailReport && (
              <>
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
                  <div>
                    <h2 className="text-lg font-bold text-gray-800">综合报告详情</h2>
                    <p className="text-sm text-gray-400 mt-0.5">
                      {detailReport.nickname} · {detailReport.phone || '无手机号'} · {detailReport.createdAtDisplay || (detailReport.createdAt ? new Date(detailReport.createdAt).toLocaleString('zh-CN') : '')}
                    </p>
                  </div>
                  <button onClick={closeDetail} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
                </div>

                {/* Body — 综合报告预览（优先HTML，降级JSON） */}
                <div className="overflow-y-auto flex-1 px-6 py-4">
                    {/* 预览模式切换 */}
                    <div className="flex items-center gap-2 mb-3">
                      <button
                        onClick={() => setPreviewMode('html')}
                        className={`text-xs px-3 py-1 rounded-full ${previewMode === 'html' ? 'bg-indigo-100 text-indigo-700 font-medium' : 'bg-gray-100 text-gray-500'}`}
                      >
                        标准化报告
                      </button>
                      <button
                        onClick={() => setPreviewMode('json')}
                        className={`text-xs px-3 py-1 rounded-full ${previewMode === 'json' ? 'bg-indigo-100 text-indigo-700 font-medium' : 'bg-gray-100 text-gray-500'}`}
                      >
                        JSON数据
                      </button>
                      {!detailReport.reportHtml && (
                        <span className="text-[10px] text-amber-500 ml-1">报告尚未生成，请先点击生成</span>
                      )}
                    </div>

                    {previewMode === 'html' && detailReport.reportHtml ? (
                      <iframe
                        srcDoc={detailReport.reportHtml}
                        title="报告预览"
                        className="w-full border border-gray-200 rounded-lg"
                        style={{ height: '70vh', minHeight: '600px' }}
                        sandbox="allow-same-origin allow-scripts"
                      />
                    ) : previewMode === 'html' && !detailReport.reportHtml ? (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
                        <p className="text-amber-700 text-sm mb-3">⚠️ 报告尚未生成</p>
                        <p className="text-amber-600 text-xs mb-4">
                          当前系统已放弃JSON自动生成方案。请点击下方"生成报告"按钮，系统将调用AI分析并组装标准化报告模版。
                        </p>
                        <button
                          onClick={() => handleGenerate(detailReport.id)}
                          disabled={generateLoading === detailReport.id}
                          className="px-6 py-2 rounded-lg bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 disabled:opacity-50"
                        >
                          {generateLoading === detailReport.id ? '生成中…' : '🚀 生成标准化报告'}
                        </button>
                      </div>
                    ) : (
                      // JSON数据视图
                      (() => {
                        const report = parseReportJSON(detailReport.reportContent)
                        if (!report) {
                          return (
                            <div className="bg-gray-50 rounded-lg px-4 py-3 text-sm text-gray-400">
                              {detailReport.reportContent
                                ? <pre className="text-xs overflow-auto max-h-96 whitespace-pre-wrap">{detailReport.reportContent}</pre>
                                : '暂无报告内容'}
                            </div>
                          )
                        }
                        return (
                          <div className="max-w-2xl">
                            <LZUScoreSection
                              score={report.comprehensiveScore}
                              grade={report.grade}
                              gradeDescription={report.gradeDescription}
                            />
                            <LZUReportSummary
                              evaluation={report.coreEvaluation}
                              advantages={report.coreAdvantages || []}
                              summary={report.summary || ''}
                            />
                            {report.leadershipAnalysis && (
                              <LZULeadershipSection data={report.leadershipAnalysis} />
                            )}
                            {report.personalityAnalysis && (
                              <LZUPersonalitySection data={report.personalityAnalysis} />
                            )}
                            {report.creativityBarrierAnalysis && (
                              <LZUCreativityBarrierSection data={report.creativityBarrierAnalysis} />
                            )}
                            {report.careerSuggestions && report.careerSuggestions.length > 0 && (
                              <LZUCareerSection suggestions={report.careerSuggestions} />
                            )}
                            {report.improvementPlan && (
                              <LZUImprovementPlanSection plan={report.improvementPlan} />
                            )}
                          </div>
                        )
                      })()
                    )}
                </div>

                {/* Footer - 审核操作 + 生成 + 下载 */}
                <div className="px-6 py-3 border-t flex items-center justify-between shrink-0 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    {detailReport.reviewStatus === 'pending' && (
                      <>
                        <span className="text-xs text-gray-400">审核：</span>
                        <button
                          onClick={() => handleApprove(detailReport.id)}
                          disabled={reviewLoading}
                          className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-medium hover:bg-green-700 disabled:opacity-50"
                        >
                          ✅ 通过
                        </button>
                        <button
                          onClick={() => handleReject(detailReport.id)}
                          disabled={reviewLoading}
                          className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-medium hover:bg-red-600 disabled:opacity-50"
                        >
                          ❌ 退回
                        </button>
                        <button
                          onClick={() => handleGenerate(detailReport.id)}
                          disabled={generateLoading === detailReport.id}
                          className="px-3 py-1.5 rounded-lg bg-amber-500 text-white text-xs font-medium hover:bg-amber-600 disabled:opacity-50"
                        >
                          {generateLoading === detailReport.id ? '生成中…' : '🤖 重新生成'}
                        </button>
                      </>
                    )}
                    {detailReport.reviewStatus === 'approved' && (
                      <span className="text-sm text-green-600 font-medium">✅ 已通过审核</span>
                    )}
                    {detailReport.reviewStatus === 'rejected' && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-red-500 font-medium">❌ 已退回</span>
                        {detailReport.reviewComment && (
                          <span className="text-xs text-gray-400">原因：{detailReport.reviewComment}</span>
                        )}
                        <button
                          onClick={() => handleApprove(detailReport.id)}
                          disabled={reviewLoading}
                          className="ml-2 px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-medium hover:bg-green-700 disabled:opacity-50"
                        >
                          改为通过
                        </button>
                        <button
                          onClick={() => handleGenerate(detailReport.id)}
                          disabled={generateLoading === detailReport.id}
                          className="px-3 py-1.5 rounded-lg bg-amber-500 text-white text-xs font-medium hover:bg-amber-600 disabled:opacity-50"
                        >
                          {generateLoading === detailReport.id ? '生成中…' : '🤖 重新生成'}
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {detailReport.reportHtml && (
                      <button
                        onClick={() => handleDownload(detailReport.id)}
                        className="px-3 py-1.5 rounded-lg bg-indigo-500 text-white text-xs font-medium hover:bg-indigo-600"
                      >
                        📥 下载PDF
                      </button>
                    )}
                    <button
                      onClick={closeDetail}
                      className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-xs hover:bg-gray-200"
                    >
                      关闭
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
