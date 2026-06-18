import { useEffect, useState, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAssessment } from '../context/AssessmentContext'
import { useAuth } from '../context/AuthContext'
import { sessionService } from '../services/sessionService'
import { QUESTIONNAIRE_PRIORITY, LZU_QUESTIONNAIRE_PRIORITY, SUCCESSOR_QUESTIONNAIRE_PRIORITY, IS_LZU_MODE } from '../types'
import SuccessorPlaceholder from '../components/SuccessorPlaceholder'

export default function SelectQuestionnairePage() {
  const { state, dispatch } = useAssessment()
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasExistingSession, setHasExistingSession] = useState(false)
  const [existingSessionId, setExistingSessionId] = useState<number | null>(null)
  const [checkingSession, setCheckingSession] = useState(true)
  const autoStarted = useRef(false)

  // 未登录跳转
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login', { replace: true })
    }
  }, [user, authLoading, navigate])

  // 检查是否有进行中的session
  useEffect(() => {
    if (!user) return
    sessionService.getCurrent()
      .then(data => {
        if (data.session) {
          setHasExistingSession(true)
          setExistingSessionId(data.session.id)
        }
      })
      .catch(() => { /* ignore */ })
      .finally(() => setCheckingSession(false))
  }, [user])

  // 获取可用问卷列表（根据模式使用不同优先级）
  const enabledIds = new Set(
    state.questionnaires.filter(q => q.enabled).map(q => q.id)
  )

  // 根据用户身份选择对应的问卷配置
  const priorityList = useMemo(() => {
    if (user?.identity_type === 'successor') {
      // 二代版：如果有专属题库则用，否则降级到通用
      return SUCCESSOR_QUESTIONNAIRE_PRIORITY.length > 0
        ? SUCCESSOR_QUESTIONNAIRE_PRIORITY
        : (IS_LZU_MODE ? LZU_QUESTIONNAIRE_PRIORITY : QUESTIONNAIRE_PRIORITY)
    }
    // 学生版
    return IS_LZU_MODE ? LZU_QUESTIONNAIRE_PRIORITY : QUESTIONNAIRE_PRIORITY
  }, [user?.identity_type])

  const availableQuestionnaires = priorityList.filter(q =>
    enabledIds.has(q.id)
  )

  // 兰大模式：自动创建session并跳转到第一个问卷
  useEffect(() => {
    if (!IS_LZU_MODE) return
    if (autoStarted.current) return
    if (checkingSession || authLoading) return
    if (!user) return
    if (hasExistingSession) return
    if (availableQuestionnaires.length === 0) return

    autoStarted.current = true
    setSubmitting(true)

    const lzuIds = availableQuestionnaires.map(q => q.id)
    sessionService.create(lzuIds)
      .then(data => {
        dispatch({ type: 'SET_SESSION', payload: data as any })
        dispatch({ type: 'SET_ALL_SCORES', payload: {} })
        navigate(`/quiz/${data.id}`, { replace: true })
      })
      .catch(err => {
        if (err instanceof Error && err.message.includes('409')) {
          setError('您有一个进行中的测评会话，请先完成后再开始新的测评。')
        } else {
          setError(err instanceof Error ? err.message : '创建测评会话失败')
        }
        autoStarted.current = false
        setSubmitting(false)
      })
  }, [IS_LZU_MODE, checkingSession, authLoading, user, hasExistingSession, availableQuestionnaires, dispatch, navigate])

  // 非兰大模式：默认全选
  useEffect(() => {
    if (!IS_LZU_MODE && availableQuestionnaires.length > 0) {
      setSelected(new Set(availableQuestionnaires.map(q => q.id)))
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // 全选/取消全选
  const allSelected = availableQuestionnaires.length > 0 &&
    availableQuestionnaires.every(q => selected.has(q.id))

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set())
    } else {
      setSelected(new Set(availableQuestionnaires.map(q => q.id)))
    }
  }

  function toggleOne(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  async function handleStart() {
    if (selected.size === 0) return

    setSubmitting(true)
    setError(null)

    try {
      const data = await sessionService.create(Array.from(selected))
      dispatch({ type: 'SET_SESSION', payload: data as any })
      dispatch({ type: 'SET_ALL_SCORES', payload: {} })
      navigate(`/quiz/${data.id}`)
    } catch (err) {
      if (err instanceof Error && err.message.includes('409')) {
        setError('您有一个进行中的测评会话，请先完成或放弃后再开始新的测评。')
      } else {
        setError(err instanceof Error ? err.message : '创建测评会话失败')
      }
    } finally {
      setSubmitting(false)
    }
  }

  function handleContinue() {
    if (existingSessionId) {
      navigate(`/quiz/${existingSessionId}`)
    }
  }

  // 兰大模式：显示自动初始化loading
  if (IS_LZU_MODE) {
    if (authLoading || checkingSession) {
      return (
        <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
          <p className="text-gray-400">加载中…</p>
        </div>
      )
    }

    if (!user) return null

    // 二代用户：显示"系统完善中"页面
    if (user.identity_type === 'successor') {
      return <SuccessorPlaceholder />
    }

    // 兰大模式：正在自动创建session
    if (submitting && !hasExistingSession) {
      return (
        <div className="min-h-screen bg-[#fafafa] flex flex-col items-center justify-center px-6">
          <div className="text-5xl mb-6 animate-spin">⏳</div>
          <h2 className="text-xl font-bold text-[#1a1a2e] mb-3">正在初始化测评</h2>
          <p className="text-gray-400 text-sm mb-4">正在为您准备测评问卷…</p>
          <div className="flex gap-2">
            {availableQuestionnaires.map((q, i) => (
              <span key={q.id} className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                {i + 1}. {q.name}
              </span>
            ))}
          </div>
          {error && (
            <div className="mt-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm text-center max-w-xs">
              {error}
            </div>
          )}
        </div>
      )
    }

    // 兰大模式：有进行中session，显示继续测评
    if (hasExistingSession) {
      return (
        <div className="min-h-screen bg-[#fafafa] pb-20">
          <header className="bg-white border-b border-black/[0.04] sticky top-0 z-40">
            <div className="flex items-center justify-between px-6 h-14 max-w-2xl mx-auto">
              <h1 className="text-lg font-bold text-[#1a1a2e]">大学生职业发展测评</h1>
            </div>
          </header>
          <main className="px-6 py-6 max-w-2xl mx-auto">
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-6 text-center">
              <span className="text-3xl mb-3 block">📋</span>
              <h3 className="font-bold text-amber-800 mb-2">您有一个未完成的测评</h3>
              <p className="text-amber-600 text-sm mb-4">
                上次测评进度已保存，您可以继续完成剩余问卷。
              </p>
              <button
                onClick={handleContinue}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-sm shadow-[0_4px_15px_rgba(245,158,11,0.3)] hover:shadow-[0_6px_20px_rgba(245,158,11,0.4)] transition-all"
              >
                继续上次测评 →
              </button>
            </div>
          </main>
        </div>
      )
    }

    return null
  }

  // ========== 非兰大模式：问卷选择 ==========

  if (authLoading || checkingSession) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <p className="text-gray-400">加载中…</p>
      </div>
    )
  }

  if (!user) return null

  // 二代用户：显示"系统完善中"页面
  if (user.identity_type === 'successor') {
    return <SuccessorPlaceholder />
  }

  return (
    <div className="min-h-screen bg-[#fafafa] pb-20">
      {/* Header */}
      <header className="bg-white border-b border-black/[0.04] sticky top-0 z-40">
        <div className="flex items-center justify-between px-6 h-14 max-w-2xl mx-auto">
          <h1 className="text-lg font-bold text-[#1a1a2e]">选择测评</h1>
          <span className="text-xs text-gray-400">
            {availableQuestionnaires.length} 个问卷可用
          </span>
        </div>
      </header>

      <main className="px-6 py-6 max-w-2xl mx-auto">
        {/* 已有进行中session的提示 */}
        {hasExistingSession && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-6 text-center">
            <span className="text-3xl mb-3 block">📋</span>
            <h3 className="font-bold text-amber-800 mb-2">您有一个未完成的测评</h3>
            <p className="text-amber-600 text-sm mb-4">
              上次测评进度已保存，您可以继续完成剩余问卷。
            </p>
            <button
              onClick={handleContinue}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-sm shadow-[0_4px_15px_rgba(245,158,11,0.3)] hover:shadow-[0_6px_20px_rgba(245,158,11,0.4)] transition-all"
            >
              继续上次测评 →
            </button>
            <p className="text-amber-400 text-xs mt-3">
              如需重新选择问卷，请先完成或等待当前会话过期
            </p>
          </div>
        )}

        {/* 没有进行中session时显示问卷选择 */}
        {!hasExistingSession && (
          <>
            {/* 引导语 */}
            <div className="mb-6">
              <h2 className="text-lg font-bold text-[#1a1a2e] mb-1">
                选择你想做的测评问卷
              </h2>
              <p className="text-sm text-gray-400">
                勾选感兴趣的问卷，我们将按最佳顺序引导你完成
              </p>
            </div>

            {/* 全选操作 */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={toggleAll}
                className="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                {allSelected ? '取消全选' : '全选（推荐）'}
              </button>
              <span className="text-xs text-gray-400">
                已选 {selected.size}/{availableQuestionnaires.length}
              </span>
            </div>

            {/* 问卷卡片列表 */}
            <div className="space-y-3 mb-8">
              {availableQuestionnaires.map((q, idx) => {
                const isSelected = selected.has(q.id)
                return (
                  <button
                    key={q.id}
                    onClick={() => toggleOne(q.id)}
                    className={`w-full text-left p-4 rounded-2xl border-2 transition-all duration-200 ${
                      isSelected
                        ? 'border-indigo-400 bg-indigo-50 shadow-[0_4px_16px_rgba(99,102,241,0.1)]'
                        : 'border-black/[0.04] bg-white hover:border-indigo-200 hover:bg-indigo-50/30'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {/* 序号 */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        isSelected
                          ? 'bg-indigo-500 text-white'
                          : 'bg-gray-100 text-gray-400'
                      }`}>
                        {isSelected ? '✓' : idx + 1}
                      </div>

                      {/* 内容 */}
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-bold text-sm mb-0.5 ${
                          isSelected ? 'text-indigo-700' : 'text-[#1a1a2e]'
                        }`}>
                          {q.name}
                        </h3>
                        <p className="text-xs text-gray-400">
                          {q.questions} 题 · 约 {q.estimatedMinutes} 分钟
                        </p>
                      </div>

                      {/* 勾选框 */}
                      <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all ${
                        isSelected
                          ? 'bg-indigo-500 border-indigo-500'
                          : 'border-gray-200'
                      }`}>
                        {isSelected && (
                          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* 错误提示 */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-4 text-center">
                {error}
              </div>
            )}

            {/* 开始按钮 */}
            <button
              onClick={handleStart}
              disabled={selected.size === 0 || submitting}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white font-bold text-base shadow-[0_4px_20px_rgba(99,102,241,0.3)] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
            >
              {submitting
                ? '创建中…'
                : selected.size === 0
                ? '请至少选择一个测评问卷'
                : `开始探索（${selected.size}个问卷）`}
            </button>

            {/* 推荐提示 */}
            {selected.size < availableQuestionnaires.length && selected.size > 0 && (
              <p className="text-center text-xs text-gray-400 mt-4">
                💡 推荐全选以获得最完整的人才画像
              </p>
            )}
          </>
        )}
      </main>
    </div>
  )
}
