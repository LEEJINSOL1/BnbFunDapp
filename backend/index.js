require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const { ethers } = require('ethers'); // v5 스타일 유지
const cors = require('cors');
const TokenFactoryABI = require('../frontend/src/abis/TokenFactory.json');

const app = express();
app.use(cors());
app.use(express.json());

// MySQL 연결 설정
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
};

// BSC Testnet 설정
let provider;
try {
    provider = new ethers.providers.JsonRpcProvider(process.env.BSC_TESTNET_RPC);
    provider.getBlockNumber().then(block => {
        console.log("BSC Testnet 연결 성공, 현재 블록:", block);
    }).catch(err => {
        console.error("BSC Testnet 연결 실패:", err);
    });
} catch (err) {
    console.error("Provider 초기화 실패:", err);
    process.exit(1);
}

const tokenFactory = new ethers.Contract(process.env.TOKEN_FACTORY_ADDRESS, TokenFactoryABI, provider);

// MySQL 연결 풀 생성
const pool = mysql.createPool(dbConfig);

// 블록체인에서 토큰 목록 동기화 (주기적으로 실행)
const syncTokens = async () => {
    try {
        const latestBlock = await provider.getBlockNumber();
        const blockRange = 50;
        let allEvents = [];
        for (let i = latestBlock; i > Math.max(latestBlock - 1000, 0); i -= blockRange) {
            const fromBlock = Math.max(i - blockRange, 0);
            const toBlock = i;
            const filter = tokenFactory.filters.TokenCreated();
            const events = await tokenFactory.queryFilter(filter, fromBlock, toBlock);
            allEvents = [...allEvents, ...events];
        }

        if (allEvents.length === 0) {
            console.log("최근 1,000 블록 내 새로운 토큰 없음");
            return;
        }

        const blockNumbers = [...new Set(allEvents.map(event => event.blockNumber))];
        const blocks = await Promise.all(
            blockNumbers.map(blockNumber => provider.getBlock(blockNumber))
        );
        const blockMap = blocks.reduce((map, block) => {
            map[block.number] = block;
            return map;
        }, {});

        const connection = await pool.getConnection();
        for (const event of allEvents) {
            const block = blockMap[event.blockNumber];
            const token = {
                token_address: event.args.tokenAddress,
                name: event.args.name,
                symbol: event.args.symbol,
                created_at: new Date(block.timestamp * 1000).toISOString().slice(0, 19).replace('T', ' '),
                raised_funds: '0 BNB',
                volume: '0 BNB',
            };

            await connection.query(
                'INSERT INTO tokens (token_address, name, symbol, created_at, raised_funds, volume) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name = ?, symbol = ?, created_at = ?, raised_funds = ?, volume = ?',
                [token.token_address, token.name, token.symbol, token.created_at, token.raised_funds, token.volume,
                 token.name, token.symbol, token.created_at, token.raised_funds, token.volume]
            );
        }
        connection.release();
        console.log(`${allEvents.length}개의 토큰 동기화 완료`);
    } catch (err) {
        console.error("토큰 동기화 실패:", err);
    }
};

// 서버 시작 시 초기 동기화 및 주기적 동기화 (1분마다)
syncTokens();
setInterval(syncTokens, 60 * 1000);

// API: 토큰 목록 조회
app.get('/api/tokens', async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query('SELECT * FROM tokens ORDER BY created_at DESC');
        connection.release();
        res.json(rows);
    } catch (err) {
        console.error("토큰 목록 조회 실패:", err);
        res.status(500).json({ error: "토큰 목록 조회 실패" });
    }
});

// API: 새 토큰 추가
app.post('/api/tokens', async (req, res) => {
    const { tokenAddress, name, symbol, createdAt, raisedFunds, volume } = req.body;
    try {
        const connection = await pool.getConnection();
        await connection.query(
            'INSERT INTO tokens (token_address, name, symbol, created_at, raised_funds, volume) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name = ?, symbol = ?, created_at = ?, raised_funds = ?, volume = ?',
            [tokenAddress, name, symbol, createdAt, raisedFunds, volume,
             name, symbol, createdAt, raisedFunds, volume]
        );
        connection.release();
        res.status(201).json({ message: "토큰 추가 성공" });
    } catch (err) {
        console.error("토큰 추가 실패:", err);
        res.status(500).json({ error: "토큰 추가 실패" });
    }
});

// 서버 시작
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
});