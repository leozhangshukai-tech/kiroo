const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const { initDatabase, getPool } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// DeepSeek API 代理接口 - 单问卷AI分析（保留兼容旧版）
app.post('/api/generate-report', async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'prompt is required' });
  }

  try {
    const { callDeepSeek } = require('./services/deepseekClient');
    const content = await callDeepSeek({
      prompt,
      maxTokens: 2048,
      temperature: 0.7,
      timeoutMs: 60000,
    });

    if (!content) {
      return res.status(500).json({ error: 'AI service unavailable' });
    }

    res.json({ content });
  } catch (err) {
    console.error('API proxy error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DeepSeek API 代理接口 - 综合报告生成（结构化JSON输出）
app.post('/api/generate-comprehensive-report', async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'prompt is required' });
  }

  try {
    const { callDeepSeek } = require('./services/deepseekClient');
    const content = await callDeepSeek({
      prompt,
      maxTokens: 4096,
      temperature: 0.7,
      timeoutMs: 120000,
      jsonMode: true,
    });

    if (!content) {
      return res.status(500).json({ error: 'AI service unavailable' });
    }

    try {
      const parsed = JSON.parse(content);
      res.json({ content, parsed });
    } catch {
      res.json({ content });
    }
  } catch (err) {
    console.error('API proxy error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 综合报告保存接口（在AI生成后调用）
app.post('/api/reports/save', async (req, res) => {
  const { sessionId, userId, questionnairesCompleted, scoreSummary, reportContent, comprehensiveScore, token } = req.body;

  if (!sessionId || !userId || !reportContent || !comprehensiveScore) {
    return res.status(400).json({ error: '缺少必要的报告数据' });
  }

  if (!token) {
    return res.status(401).json({ error: '未登录' });
  }

  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.id !== userId) {
      return res.status(403).json({ error: '无权操作' });
    }
  } catch {
    return res.status(401).json({ error: 'Token无效' });
  }

  try {
    const pool = getPool();

    const [existing] = await pool.query(
      'SELECT id FROM comprehensive_reports WHERE session_id = ?',
      [sessionId]
    );

    if (existing.length > 0) {
      await pool.query(
        `UPDATE comprehensive_reports
         SET report_content = ?, comprehensive_score = ?, score_summary = ?,
             review_status = 'pending', updated_at = datetime('now')
         WHERE session_id = ?`,
        [reportContent, comprehensiveScore, JSON.stringify(scoreSummary), sessionId]
      );

      await pool.query(
        'UPDATE assessment_sessions SET status = ? WHERE id = ?',
        ['submitted', sessionId]
      );

      return res.json({ message: '报告已更新', reportId: existing[0].id });
    }

    const [result] = await pool.query(
      `INSERT INTO comprehensive_reports
       (session_id, user_id, questionnaires_completed, score_summary, report_content, comprehensive_score, review_status)
       VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
      [
        sessionId,
        userId,
        JSON.stringify(questionnairesCompleted),
        JSON.stringify(scoreSummary),
        reportContent,
        comprehensiveScore,
      ]
    );

    await pool.query(
      'UPDATE assessment_sessions SET status = ? WHERE id = ?',
      ['submitted', sessionId]
    );

    res.status(201).json({ message: '报告已保存', reportId: result.insertId });
  } catch (err) {
    console.error('Save report error:', err);
    res.status(500).json({ error: '保存报告失败' });
  }
});

// 健康检查接口（含队列状态，供前端轮询）
app.get('/api/health', (req, res) => {
  const queueStatus = require('./services/queueService').getStatus();
  res.json({
    status: 'ok',
    time: new Date().toISOString(),
    queue: queueStatus,
  });
});

// ============================================================
// Async startup: init DB then mount routes and start listening
// ============================================================
async function start() {
  await initDatabase();

  const authRoutes = require('./routes/auth');
  const assessmentRoutes = require('./routes/assessment');
  const adminRoutes = require('./routes/admin');
  const sessionRoutes = require('./routes/session');
  const reportRoutes = require('./routes/report');

  app.use('/api/auth', authRoutes);
  app.use('/api/assessments', assessmentRoutes);
  app.use('/api/sessions', sessionRoutes);
  app.use('/api/reports', reportRoutes);
  app.use('/api/admin', adminRoutes);

  // 为报告HTML模板提供 Chart.js（雷达图渲染需要）
  app.get('/chart.umd.js', (req, res) => {
    const chartPath = path.join(__dirname, '..', 'node_modules', 'chart.js', 'dist', 'chart.umd.js');
    res.sendFile(chartPath);
  });

  // 托管前端静态文件（兼容本地开发 server/dist 和 Docker /app/dist）
  const distPath = fs.existsSync(path.join(__dirname, 'dist'))
    ? path.join(__dirname, 'dist')
    : path.join(__dirname, '..', 'dist');
  app.use(express.static(distPath));

  // SPA 路由兜底
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(distPath, 'index.html'));
    }
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`   API: http://localhost:${PORT}/api/`);
    console.log(`   LZU Mode: ${process.env.LZU_MODE || 'false'}`);
  });
}

start().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
