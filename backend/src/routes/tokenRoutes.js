const express = require('express');
const router = express.Router();
const Token = require('../models/Token');
const Transaction = require('../models/Transaction');

// 새 토큰 저장
router.post('/', async (req, res) => {
  const { address, name, ticker, creator } = req.body;
  try {
    const token = await Token.create({ address, name, ticker, creator });
    res.status(201).json(token);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 토큰 리스트 반환
router.get('/', async (req, res) => {
  try {
    const tokens = await Token.findAll();
    res.status(200).json(tokens);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 특정 토큰의 트랜잭션 내역 반환
router.get('/transactions/:tokenAddress', async (req, res) => {
  try {
    const token = await Token.findOne({ where: { address: req.params.tokenAddress } });
    if (!token) return res.status(404).json({ error: 'Token not found' });
    const transactions = await Transaction.findAll({ where: { tokenId: token.id } });
    res.status(200).json(transactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;