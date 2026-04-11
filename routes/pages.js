/**
 * 页面路由
 */
const express = require('express');
const path = require('path');
const router = express.Router();

const { authMiddleware } = require('../middleware');

// 项目根目录
const PROJECT_ROOT = path.join(__dirname, '..');

/**
 * GET /
 * 首页重定向
 */
router.get('/', authMiddleware, (req, res) => {
    res.sendFile(path.join(PROJECT_ROOT, 'public', 'index.html'));
});

module.exports = router;
