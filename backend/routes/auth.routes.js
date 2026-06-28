const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { login, logout, me } = require('../controllers/auth.controller');

router.post('/login', login);          // public
router.post('/logout', logout);        // public (just clears cookies)
router.get('/me', auth, me);           // protected — confirms an active session

module.exports = router;
