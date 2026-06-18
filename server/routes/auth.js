const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getPool } = require('../db');
const pool = getPool();
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { phone, password, nickname, identity_type } = req.body;

  if (!phone || !/^\d{11}$/.test(phone)) {
    return res.status(400).json({ error: '请输入正确的手机号' });
  }
  if (!password || password.length < 6) {
    return res.status(400).json({ error: '密码至少6位' });
  }
  if (!nickname || nickname.trim().length === 0 || nickname.length > 50) {
    return res.status(400).json({ error: '姓名不能为空且不超过50字' });
  }

  // 验证身份类型
  const validTypes = ['student', 'successor'];
  const userIdentity = validTypes.includes(identity_type) ? identity_type : 'student';

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Check if phone already registered
    const [existing] = await conn.query(
      'SELECT id FROM user_auth_methods WHERE auth_type = ? AND identifier = ?',
      ['phone', phone]
    );
    if (existing.length > 0) {
      await conn.rollback();
      return res.status(409).json({ error: '该手机号已注册' });
    }

    // Create user
    const [userResult] = await conn.query(
      'INSERT INTO users (nickname, phone, identity_type) VALUES (?, ?, ?)',
      [nickname || '用户', phone, userIdentity]
    );
    const userId = userResult.insertId;

    // Create auth methods (phone + password)
    const passwordHash = await bcrypt.hash(password, 10);
    await conn.query(
      'INSERT INTO user_auth_methods (user_id, auth_type, identifier, credential) VALUES (?, ?, ?, ?)',
      [userId, 'phone', phone, null]
    );
    await conn.query(
      'INSERT INTO user_auth_methods (user_id, auth_type, identifier, credential) VALUES (?, ?, ?, ?)',
      [userId, 'password', phone, passwordHash]
    );

    await conn.commit();

    // Generate token
    const token = jwt.sign({ id: userId, nickname: nickname || '用户' }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: { id: userId, nickname: nickname || '用户', phone, identity_type: userIdentity },
    });
  } catch (err) {
    await conn.rollback();
    console.error('Register error:', err);
    res.status(500).json({ error: '注册失败，请稍后重试' });
  } finally {
    conn.release();
  }
});

// POST /api/auth/login/password
router.post('/login/password', async (req, res) => {
  const { phone, password } = req.body;

  if (!phone || !password) {
    return res.status(400).json({ error: '请输入手机号和密码' });
  }

  try {
    // Find password auth method
    const [rows] = await pool.query(
      `SELECT u.id, u.nickname, u.phone, u.identity_type, uam.credential
       FROM user_auth_methods uam
       JOIN users u ON u.id = uam.user_id
       WHERE uam.auth_type = 'password' AND uam.identifier = ?`,
      [phone]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: '账号不存在' });
    }

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.credential);
    if (!valid) {
      return res.status(401).json({ error: '密码错误' });
    }

    const token = jwt.sign({ id: user.id, nickname: user.nickname }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: { id: user.id, nickname: user.nickname, phone: user.phone, identity_type: user.identity_type || 'student' },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: '登录失败，请稍后重试' });
  }
});

// POST /api/auth/send-code
router.post('/send-code', async (req, res) => {
  const { phone } = req.body;

  if (!phone || !/^\d{11}$/.test(phone)) {
    return res.status(400).json({ error: '请输入正确的手机号' });
  }

  try {
    // Rate limit: 60s cooldown
    const [recent] = await pool.query(
      'SELECT id FROM sms_codes WHERE phone = ? AND created_at > DATE_SUB(NOW(), INTERVAL 60 SECOND)',
      [phone]
    );
    if (recent.length > 0) {
      return res.status(429).json({ error: '发送过于频繁，请60秒后再试' });
    }

    // Rate limit: 10 per day
    const [todayCount] = await pool.query(
      'SELECT COUNT(*) as cnt FROM sms_codes WHERE phone = ? AND created_at > CURDATE()',
      [phone]
    );
    if (todayCount[0].cnt >= 10) {
      return res.status(429).json({ error: '今日发送次数已达上限' });
    }

    // Phase 1: use fixed code; Phase 2: switch to real SMS
    const code = process.env.SMS_ENABLED === 'true'
      ? Math.floor(100000 + Math.random() * 900000).toString()
      : '123456';

    // If SMS is enabled, send via Tencent Cloud
    if (process.env.SMS_ENABLED === 'true') {
      const smsService = require('../services/smsService');
      await smsService.send(phone, code);
    }

    // Store code (valid 5 minutes)
    await pool.query(
      'INSERT INTO sms_codes (phone, code, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 5 MINUTE))',
      [phone, code]
    );

    res.json({ message: '验证码已发送' });
  } catch (err) {
    console.error('Send code error:', err);
    res.status(500).json({ error: '发送验证码失败' });
  }
});

// POST /api/auth/login/phone
router.post('/login/phone', async (req, res) => {
  const { phone, code } = req.body;

  if (!phone || !code) {
    return res.status(400).json({ error: '请输入手机号和验证码' });
  }

  const conn = await pool.getConnection();
  try {
    // Verify code
    const [codes] = await conn.query(
      'SELECT id FROM sms_codes WHERE phone = ? AND code = ? AND expires_at > NOW() AND used = 0 ORDER BY id DESC LIMIT 1',
      [phone, code]
    );

    // Phase 1: also accept dev bypass code
    const devBypass = process.env.SMS_ENABLED !== 'true' && code === '123456';

    if (codes.length === 0 && !devBypass) {
      return res.status(400).json({ error: '验证码错误或已过期' });
    }

    // Mark code as used
    if (codes.length > 0) {
      await conn.query('UPDATE sms_codes SET used = 1 WHERE id = ?', [codes[0].id]);
    }

    // Find or create user
    const [existing] = await conn.query(
      `SELECT u.id, u.nickname, u.phone, u.identity_type
       FROM user_auth_methods uam
       JOIN users u ON u.id = uam.user_id
       WHERE uam.auth_type = 'phone' AND uam.identifier = ?`,
      [phone]
    );

    let user;
    if (existing.length > 0) {
      user = existing[0];
    } else {
      // Auto-create user
      await conn.beginTransaction();

      const [userResult] = await conn.query(
        'INSERT INTO users (nickname, phone) VALUES (?, ?)',
        ['用户', phone]
      );
      const userId = userResult.insertId;

      // Bind phone auth
      await conn.query(
        'INSERT INTO user_auth_methods (user_id, auth_type, identifier, credential) VALUES (?, ?, ?, ?)',
        [userId, 'phone', phone, null]
      );

      // Bind random password
      const randomPassword = Math.random().toString(36).slice(-8);
      const passwordHash = await bcrypt.hash(randomPassword, 10);
      await conn.query(
        'INSERT INTO user_auth_methods (user_id, auth_type, identifier, credential) VALUES (?, ?, ?, ?)',
        [userId, 'password', phone, passwordHash]
      );

      await conn.commit();

      user = { id: userId, nickname: '用户', phone };
    }

    const token = jwt.sign({ id: user.id, nickname: user.nickname }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: { id: user.id, nickname: user.nickname, phone: user.phone, identity_type: user.identity_type || 'student' },
    });
  } catch (err) {
    await conn.rollback();
    console.error('Phone login error:', err);
    res.status(500).json({ error: '登录失败，请稍后重试' });
  } finally {
    conn.release();
  }
});

// GET /api/auth/profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, nickname, phone, identity_type, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: '用户不存在' });
    }
    res.json({ user: rows[0] });
  } catch (err) {
    console.error('Profile error:', err);
    res.status(500).json({ error: '获取用户信息失败' });
  }
});

// POST /api/auth/update-password
router.post('/update-password', authMiddleware, async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: '新密码至少6位' });
  }

  try {
    // Get current password
    const [rows] = await pool.query(
      `SELECT uam.id, uam.credential
       FROM user_auth_methods uam
       WHERE uam.user_id = ? AND uam.auth_type = 'password'`,
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(400).json({ error: '未设置密码，请先通过验证码登录后设置' });
    }

    const valid = await bcrypt.compare(oldPassword, rows[0].credential);
    if (!valid) {
      return res.status(401).json({ error: '原密码错误' });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await pool.query(
      'UPDATE user_auth_methods SET credential = ? WHERE id = ?',
      [newHash, rows[0].id]
    );

    res.json({ message: '密码修改成功' });
  } catch (err) {
    console.error('Update password error:', err);
    res.status(500).json({ error: '修改密码失败' });
  }
});

// POST /api/auth/update-nickname
router.post('/update-nickname', authMiddleware, async (req, res) => {
  const { nickname } = req.body;

  if (!nickname || nickname.trim().length === 0 || nickname.length > 50) {
    return res.status(400).json({ error: '姓名不能为空且不超过50字' });
  }

  try {
    await pool.query('UPDATE users SET nickname = ? WHERE id = ?', [nickname.trim(), req.user.id]);

    const token = jwt.sign({ id: req.user.id, nickname: nickname.trim() }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({ message: '姓名修改成功', token, nickname: nickname.trim() });
  } catch (err) {
    console.error('Update nickname error:', err);
    res.status(500).json({ error: '修改姓名失败' });
  }
});

// POST /api/auth/update-identity
router.post('/update-identity', authMiddleware, async (req, res) => {
  const { identity_type } = req.body;

  if (!identity_type || !['student', 'successor'].includes(identity_type)) {
    return res.status(400).json({ error: '无效的身份类型' });
  }

  try {
    await pool.query(
      'UPDATE users SET identity_type = ?, updated_at = datetime(\'now\') WHERE id = ?',
      [identity_type, req.user.id]
    );

    res.json({ message: '身份修改成功', identity_type });
  } catch (err) {
    console.error('Update identity error:', err);
    res.status(500).json({ error: '修改身份失败' });
  }
});

module.exports = router;
