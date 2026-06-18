const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getPool } = require('../db');
const pool = getPool();
const { toChinaISO, toChinaShort } = require('../utils/timeUtils');
const adminAuthMiddleware = require('../middleware/adminAuth');

const router = express.Router();

// POST /api/admin/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: '请输入用户名和密码' });
  }

  try {
    const [rows] = await pool.query(
      'SELECT id, username, password_hash, role FROM admins WHERE username = ?',
      [username]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    const admin = rows[0];
    const valid = await bcrypt.compare(password, admin.password_hash);
    if (!valid) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    const token = jwt.sign(
      { id: admin.id, username: admin.username, role: admin.role },
      process.env.ADMIN_JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token, admin: { id: admin.id, username: admin.username, role: admin.role } });
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ error: '登录失败' });
  }
});

// GET /api/admin/stats
router.get('/stats', adminAuthMiddleware, async (req, res) => {
  try {
    const [[{ totalUsers }]] = await pool.query('SELECT COUNT(*) as totalUsers FROM users');
    const [[{ totalAssessments }]] = await pool.query('SELECT COUNT(*) as totalAssessments FROM assessment_records');
    const [[{ todayAssessments }]] = await pool.query(
      'SELECT COUNT(*) as todayAssessments FROM assessment_records WHERE DATE(created_at) = CURDATE()'
    );
    const [[{ totalReports }]] = await pool.query('SELECT COUNT(*) as totalReports FROM comprehensive_reports');
    const [[{ pendingReports }]] = await pool.query(
      "SELECT COUNT(*) as pendingReports FROM comprehensive_reports WHERE review_status = 'pending'"
    );

    const [distribution] = await pool.query(
      `SELECT questionnaire_id AS id, questionnaire_name AS name, COUNT(*) as count
       FROM assessment_records
       GROUP BY questionnaire_id, questionnaire_name
       ORDER BY count DESC`
    );

    res.json({
      totalUsers,
      totalAssessments,
      todayAssessments,
      totalReports,
      pendingReports,
      questionnaireDistribution: distribution,
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ error: '获取统计数据失败' });
  }
});

// GET /api/admin/ranking - 综合分数排名
router.get('/ranking', adminAuthMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
         u.id AS userId,
         u.nickname,
         u.phone,
         MAX(cr.comprehensive_score) AS bestScore,
         (SELECT COUNT(*) FROM assessment_records ar WHERE ar.user_id = u.id) AS assessmentCount,
         MAX(cr.created_at) AS latestAssessmentDate
       FROM comprehensive_reports cr
       JOIN users u ON u.id = cr.user_id
       GROUP BY u.id
       ORDER BY bestScore DESC`
    );

    const ranking = rows.map(r => ({
      ...r,
      latestAssessmentDate: r.latestAssessmentDate ? toChinaISO(r.latestAssessmentDate) : null,
      latestAssessmentDisplay: r.latestAssessmentDate ? toChinaShort(r.latestAssessmentDate) : null,
    }));

    res.json({ ranking });
  } catch (err) {
    console.error('Admin ranking error:', err);
    res.status(500).json({ error: '获取排名数据失败' });
  }
});

// GET /api/admin/users
router.get('/users', adminAuthMiddleware, async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 20;
  const offset = (page - 1) * pageSize;
  const keyword = req.query.keyword || '';

  try {
    let query = 'SELECT id, nickname, phone, created_at FROM users';
    let countQuery = 'SELECT COUNT(*) as total FROM users';
    const params = [];

    if (keyword) {
      const where = ' WHERE nickname LIKE ? OR phone LIKE ?';
      query += where;
      countQuery += where;
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(pageSize, offset);

    const [[{ total }]] = await pool.query(countQuery, params.slice(0, keyword ? 2 : 0));
    const [rows] = await pool.query(query, params);

    res.json({ users: rows, total, page, pageSize });
  } catch (err) {
    console.error('Admin users error:', err);
    res.status(500).json({ error: '获取用户列表失败' });
  }
});

// ==================== 旧版测评记录管理（保留） ====================

// GET /api/admin/assessments
router.get('/assessments', adminAuthMiddleware, async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 20;
  const offset = (page - 1) * pageSize;
  const { questionnaire_id, date_from, date_to, keyword, review_status } = req.query;

  try {
    let where = [];
    let params = [];

    if (questionnaire_id) {
      where.push('ar.questionnaire_id = ?');
      params.push(questionnaire_id);
    }
    if (date_from) {
      where.push('ar.created_at >= ?');
      params.push(date_from);
    }
    if (date_to) {
      where.push('ar.created_at <= ?');
      params.push(date_to + ' 23:59:59');
    }
    if (keyword) {
      where.push('(u.nickname LIKE ? OR u.phone LIKE ?)');
      params.push(`%${keyword}%`, `%${keyword}%`);
    }
    if (review_status) {
      where.push('ar.review_status = ?');
      params.push(review_status);
    }

    const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) as total FROM assessment_records ar JOIN users u ON u.id = ar.user_id ${whereClause}`,
      params
    );

    const [rows] = await pool.query(
      `SELECT ar.id, ar.questionnaire_name AS questionnaireName,
              ar.score_result AS scoreResult, ar.review_status AS reviewStatus, ar.created_at AS createdAt,
              u.nickname, u.phone
       FROM assessment_records ar
       JOIN users u ON u.id = ar.user_id
       ${whereClause}
       ORDER BY ar.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );

    const records = rows.map(r => ({
      ...r,
      scoreResult: typeof r.scoreResult === 'string' ? JSON.parse(r.scoreResult) : r.scoreResult,
    }));

    res.json({ records, total, page, pageSize });
  } catch (err) {
    console.error('Admin assessments error:', err);
    res.status(500).json({ error: '获取测评记录失败' });
  }
});

// GET /api/admin/assessments/export
router.get('/assessments/export', adminAuthMiddleware, async (req, res) => {
  const { questionnaire_id, date_from, date_to, keyword } = req.query;

  try {
    let where = [];
    let params = [];

    if (questionnaire_id) {
      where.push('ar.questionnaire_id = ?');
      params.push(questionnaire_id);
    }
    if (date_from) {
      where.push('ar.created_at >= ?');
      params.push(date_from);
    }
    if (date_to) {
      where.push('ar.created_at <= ?');
      params.push(date_to + ' 23:59:59');
    }
    if (keyword) {
      where.push('(u.nickname LIKE ? OR u.phone LIKE ?)');
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';

    const [rows] = await pool.query(
      `SELECT ar.id, u.nickname, u.phone, ar.questionnaire_name AS questionnaireName,
              ar.score_result AS scoreResult, ar.ai_report AS aiReport, ar.created_at AS createdAt
       FROM assessment_records ar
       JOIN users u ON u.id = ar.user_id
       ${whereClause}
       ORDER BY ar.created_at DESC`,
      params
    );

    const headers = ['ID', '姓名', '手机号', '测评名称', '测评结果', 'AI报告摘要', '测评时间'];
    const csvRows = [headers.map(h => `"${h}"`).join(',')];

    for (const r of rows) {
      const scoreResult = typeof r.scoreResult === 'string' ? JSON.parse(r.scoreResult) : r.scoreResult;
      let resultStr = '';
      if (scoreResult.type === 'categorical') {
        resultStr = scoreResult.categoryResult || '';
      } else if (scoreResult.type === 'additive' && scoreResult.dimensionScores) {
        resultStr = Object.entries(scoreResult.dimensionScores)
          .map(([k, v]) => `${k}:${v}`)
          .join('; ');
      }
      const reportSummary = (r.aiReport || '').substring(0, 100).replace(/"/g, '""');

      csvRows.push([
        r.id,
        `"${r.nickname}"`,
        `"${r.phone || ''}"`,
        `"${r.questionnaireName}"`,
        `"${resultStr}"`,
        `"${reportSummary}"`,
        `"${r.createdAt}"`,
      ].join(','));
    }

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=assessments.csv');
    res.send('﻿' + csvRows.join('\n'));
  } catch (err) {
    console.error('Admin export error:', err);
    res.status(500).json({ error: '导出失败' });
  }
});

// ==================== 综合报告审核（新版核心） ====================

// GET /api/admin/reports - 管理员：获取待审核综合报告列表
router.get('/reports', adminAuthMiddleware, async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 20;
  const offset = (page - 1) * pageSize;
  const { review_status, keyword, report_type } = req.query;

  try {
    let where = [];
    let params = [];

    if (review_status) {
      where.push('cr.review_status = ?');
      params.push(review_status);
    }
    if (keyword) {
      where.push('(u.nickname LIKE ? OR u.phone LIKE ?)');
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    if (report_type && ['student', 'successor'].includes(report_type)) {
      where.push('cr.report_type = ?');
      params.push(report_type);
    }

    const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) as total FROM comprehensive_reports cr
       JOIN users u ON u.id = cr.user_id
       JOIN assessment_sessions s ON s.id = cr.session_id
       ${whereClause}`,
      params
    );

    const [rows] = await pool.query(
      `SELECT cr.id, cr.session_id AS sessionId, cr.comprehensive_score AS comprehensiveScore,
              cr.review_status AS reviewStatus, cr.review_comment AS reviewComment,
              cr.report_type AS reportType, cr.report_serial_no AS reportSerialNo,
              cr.reviewed_at AS reviewedAt, cr.created_at AS createdAt,
              u.nickname, u.phone,
              s.ordered_questionnaires AS orderedQuestionnaires
       FROM comprehensive_reports cr
       JOIN users u ON u.id = cr.user_id
       JOIN assessment_sessions s ON s.id = cr.session_id
       ${whereClause}
       ORDER BY cr.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );

    const reports = rows.map(r => ({
      ...r,
      createdAt: toChinaISO(r.createdAt),
      createdAtDisplay: toChinaShort(r.createdAt),
      reviewedAt: r.reviewedAt ? toChinaISO(r.reviewedAt) : null,
      orderedQuestionnaires: typeof r.orderedQuestionnaires === 'string'
        ? JSON.parse(r.orderedQuestionnaires) : r.orderedQuestionnaires,
    }));

    res.json({ reports, total, page, pageSize });
  } catch (err) {
    console.error('Admin reports list error:', err);
    res.status(500).json({ error: '获取报告列表失败' });
  }
});

// GET /api/admin/reports/:id - 管理员：获取综合报告详情
router.get('/reports/:id', adminAuthMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT cr.id, cr.session_id AS sessionId, cr.user_id AS userId,
              cr.questionnaires_completed AS questionnairesCompleted,
              cr.score_summary AS scoreSummary,
              cr.report_content AS reportContent,
              cr.report_html AS reportHtml,
              cr.docx_path AS docxPath,
              cr.comprehensive_score AS comprehensiveScore,
              cr.review_status AS reviewStatus,
              cr.review_comment AS reviewComment,
              cr.reviewed_at AS reviewedAt,
              cr.created_at AS createdAt,
              u.nickname, u.phone,
              s.ordered_questionnaires AS orderedQuestionnaires,
              s.selected_questionnaires AS selectedQuestionnaires
       FROM comprehensive_reports cr
       JOIN users u ON u.id = cr.user_id
       JOIN assessment_sessions s ON s.id = cr.session_id
       WHERE cr.id = ?`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: '报告不存在' });
    }

    const report = rows[0];
    const dbCreatedAt = report.createdAt; // 保存原始 UTC 值
    report.createdAt = toChinaISO(dbCreatedAt);
    report.createdAtDisplay = toChinaShort(dbCreatedAt);
    if (report.reviewedAt) report.reviewedAt = toChinaISO(report.reviewedAt);
    // Parse JSON fields
    ['questionnairesCompleted', 'scoreSummary', 'orderedQuestionnaires', 'selectedQuestionnaires'].forEach(field => {
      if (report[field] && typeof report[field] === 'string') {
        report[field] = JSON.parse(report[field]);
      }
    });

    // 获取该session下所有测评记录
    const [records] = await pool.query(
      `SELECT id, questionnaire_id AS questionnaireId, questionnaire_name AS questionnaireName,
              score_result AS scoreResult, created_at AS createdAt
       FROM assessment_records
       WHERE session_id = ? AND user_id = ?
       ORDER BY id ASC`,
      [report.sessionId, report.userId]
    );

    report.assessmentRecords = records.map(r => ({
      ...r,
      scoreResult: typeof r.scoreResult === 'string' ? JSON.parse(r.scoreResult) : r.scoreResult,
    }));

    res.json({ report });
  } catch (err) {
    console.error('Admin report detail error:', err);
    res.status(500).json({ error: '获取报告详情失败' });
  }
});

// POST /api/admin/reports/:id/approve - 管理员：审核通过
router.post('/reports/:id/approve', adminAuthMiddleware, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 更新报告审核状态
    const [result] = await conn.query(
      `UPDATE comprehensive_reports
       SET review_status = 'approved', reviewed_at = NOW(), reviewed_by = ?
       WHERE id = ?`,
      [req.admin.id, req.params.id]
    );

    if (result.affectedRows === 0) {
      await conn.rollback();
      return res.status(404).json({ error: '报告不存在' });
    }

    // 同时更新session状态
    const [reportRows] = await conn.query(
      'SELECT session_id FROM comprehensive_reports WHERE id = ?',
      [req.params.id]
    );

    if (reportRows.length > 0) {
      await conn.query(
        "UPDATE assessment_sessions SET status = 'approved' WHERE id = ?",
        [reportRows[0].session_id]
      );
    }

    await conn.commit();
    res.json({ message: '审核已通过' });
  } catch (err) {
    await conn.rollback();
    console.error('Approve report error:', err);
    res.status(500).json({ error: '审核操作失败' });
  } finally {
    conn.release();
  }
});

// POST /api/admin/reports/:id/reject - 管理员：退回
router.post('/reports/:id/reject', adminAuthMiddleware, async (req, res) => {
  const { comment } = req.body;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [result] = await conn.query(
      `UPDATE comprehensive_reports
       SET review_status = 'rejected', review_comment = ?, reviewed_at = NOW(), reviewed_by = ?
       WHERE id = ?`,
      [comment || null, req.admin.id, req.params.id]
    );

    if (result.affectedRows === 0) {
      await conn.rollback();
      return res.status(404).json({ error: '报告不存在' });
    }

    // 同时更新session状态
    const [reportRows] = await conn.query(
      'SELECT session_id FROM comprehensive_reports WHERE id = ?',
      [req.params.id]
    );

    if (reportRows.length > 0) {
      await conn.query(
        "UPDATE assessment_sessions SET status = 'rejected' WHERE id = ?",
        [reportRows[0].session_id]
      );
    }

    await conn.commit();
    res.json({ message: '报告已退回' });
  } catch (err) {
    await conn.rollback();
    console.error('Reject report error:', err);
    res.status(500).json({ error: '退回操作失败' });
  } finally {
    conn.release();
  }
});

// ==================== 旧版单条审核（保留兼容） ====================

// ==================== 新版报告生成（AI + 固定模版） ====================

const lzuScoring = require('../services/lzuScoringService');
const { generateReport } = require('../services/lzuReportGenerator');
const queueService = require('../services/queueService');

// POST /api/admin/reports/:id/generate - 触发AI生成标准化报告
router.post('/reports/:id/generate', adminAuthMiddleware, async (req, res) => {
  try {
    // 获取报告基本数据
    const [rows] = await pool.query(
      `SELECT cr.id, cr.session_id AS sessionId, cr.user_id AS userId, cr.report_type AS reportType,
              cr.score_summary AS scoreSummary, cr.report_content AS reportContent,
              cr.report_serial_no AS reportSerialNo
       FROM comprehensive_reports cr
       WHERE cr.id = ?`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: '报告不存在' });
    }

    const report = rows[0];
    const scoreSummary = typeof report.scoreSummary === 'string'
      ? JSON.parse(report.scoreSummary) : (report.scoreSummary || {});

    // 获取用户信息
    const [userRows] = await pool.query(
      'SELECT nickname, identity_type FROM users WHERE id = ?', [report.userId]
    );
    const userName = userRows.length > 0 ? userRows[0].nickname : '测评用户';
    const userIdentity = userRows.length > 0 ? (userRows[0].identity_type || 'student') : 'student';

    // 根据用户身份选择不同的计分和报告生成逻辑
    let result;
    if (userIdentity === 'successor') {
      // 二代版：调用二代计分和报告生成器（待实现，先放占位）
      let successorScoring, successorGenerator;
      try {
        successorScoring = require('../services/successorScoringService');
        successorGenerator = require('../services/successorReportGenerator');
      } catch (e) {
        return res.status(501).json({ error: '二代版报告生成器尚未就绪，请等待后续更新' });
      }
      const scores = successorScoring.calculateSuccessorScore(scoreSummary);
      result = await queueService.enqueue(() => successorGenerator.generateReport({
        scores,
        userName,
        sessionId: report.sessionId,
      }));
    } else {
      // 学生版：使用现有的兰大报告生成逻辑
      const scores = lzuScoring.calculateLZUComprehensiveScore(scoreSummary);
      result = await queueService.enqueue(() => generateReport({
        scores,
        userName,
        sessionId: report.sessionId,
      }));
    }

    // 如果尚未分配序号，则自动分配
    const reportType = report.reportType || userIdentity;
    if (!report.reportSerialNo) {
      const [[{ maxNo }]] = await pool.query(
        'SELECT COALESCE(MAX(report_serial_no), 0) as maxNo FROM comprehensive_reports WHERE report_type = ?',
        [reportType]
      );
      const serialNo = maxNo + 1;
      await pool.query(
        'UPDATE comprehensive_reports SET report_type = ?, report_serial_no = ? WHERE id = ?',
        [reportType, serialNo, req.params.id]
      );
    }

    // 更新数据库：存储HTML预览 + PDF路径
    await pool.query(
      `UPDATE comprehensive_reports
       SET report_html = ?, docx_path = ?, updated_at = datetime('now')
       WHERE id = ?`,
      [result.html, result.pdfPath, req.params.id]
    );

    res.json({
      message: '报告生成成功',
      reportId: report.id,
      previewAvailable: true,
      pdfPath: result.pdfPath,
    });
  } catch (err) {
    console.error('Generate report error:', err);
    res.status(500).json({ error: '报告生成失败: ' + err.message });
  }
});

// GET /api/admin/queue-status - 查看报告生成队列状态
router.get('/queue-status', adminAuthMiddleware, (req, res) => {
  res.json(queueService.getStatus());
});

// GET /api/admin/reports/:id/preview - 获取HTML预览
router.get('/reports/:id/preview', adminAuthMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, report_html, review_status FROM comprehensive_reports WHERE id = ?',
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: '报告不存在' });
    }

    const report = rows[0];

    if (!report.report_html) {
      return res.status(400).json({ error: '报告尚未生成，请先生成报告', reportId: Number(req.params.id) });
    }

    // 返回完整HTML供iframe渲染
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(report.report_html);
  } catch (err) {
    console.error('Preview report error:', err);
    res.status(500).json({ error: '获取预览失败' });
  }
});

// GET /api/admin/reports/:id/download - 下载PDF文件
router.get('/reports/:id/download', adminAuthMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, docx_path, review_status FROM comprehensive_reports WHERE id = ?',
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: '报告不存在' });
    }

    const report = rows[0];

    if (!report.docx_path) {
      return res.status(400).json({ error: '报告文件尚未生成，请先生成报告' });
    }

    const fs = require('fs');
    const path = require('path');
    const absolutePath = path.resolve(report.docx_path);

    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ error: '报告文件丢失，请重新生成' });
    }

    const ext = path.extname(absolutePath).toLowerCase();
    const filename = `人才测评报告_${req.params.id}${ext}`;
    const mimeType = ext === '.pdf'
      ? 'application/pdf'
      : 'text/html';
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    res.sendFile(absolutePath);
  } catch (err) {
    console.error('Download report error:', err);
    res.status(500).json({ error: '下载失败' });
  }
});

// ==================== 旧版单条审核（保留兼容） ====================

// GET /api/admin/assessments/:id - 获取单条测评详情
router.get('/assessments/:id', adminAuthMiddleware, async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await pool.query(
      `SELECT ar.id, ar.questionnaire_id AS questionnaireId,
              ar.questionnaire_name AS questionnaireName,
              ar.answers, ar.score_result AS scoreResult,
              ar.ai_report AS aiReport, ar.review_status AS reviewStatus,
              ar.review_comment AS reviewComment, ar.reviewed_at AS reviewedAt,
              ar.created_at AS createdAt,
              u.nickname, u.phone
       FROM assessment_records ar
       JOIN users u ON u.id = ar.user_id
       WHERE ar.id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: '记录不存在' });
    }

    const record = rows[0];
    record.scoreResult = typeof record.scoreResult === 'string'
      ? JSON.parse(record.scoreResult)
      : record.scoreResult;
    record.answers = typeof record.answers === 'string'
      ? JSON.parse(record.answers)
      : record.answers;

    res.json(record);
  } catch (err) {
    console.error('Admin assessment detail error:', err);
    res.status(500).json({ error: '获取测评详情失败' });
  }
});

module.exports = router;
