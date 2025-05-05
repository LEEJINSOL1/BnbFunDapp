require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // 프론트엔드 주소로 제한 가능
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.json());

// MySQL 연결
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'Dlwlsthf1@',
    database: 'bnb_fund_dapp',
});

// Socket.IO 연결
io.on("connection", (socket) => {
    console.log("소켓 연결됨");

    socket.on("joinTokenRoom", (tokenAddress) => {
        socket.join(tokenAddress);
        console.log(`방 참여: ${tokenAddress}`);
    });

    socket.on("disconnect", () => {
        console.log("소켓 연결 해제됨");
    });
});

// POST /api/transactions : 트랜잭션 저장 + 실시간 전송
app.post('/api/transactions', async (req, res) => {
    const { token_address, type, token_amount, bnb_value, timestamp } = req.body;
    try {
        const connection = await pool.getConnection();
        await connection.query(
            'INSERT INTO transactions (token_address, type, token_amount, bnb_value, timestamp) VALUES (?, ?, ?, ?, ?)',
            [token_address, type, token_amount, bnb_value, timestamp]
        );
        connection.release();

        // 해당 토큰방으로 실시간 트랜잭션 전송
        io.to(token_address).emit("newTransaction", {
            type,
            amount: token_amount,
            bnbValue: bnb_value,
            timestamp
        });

        res.status(201).json({ message: "트랜잭션 저장 완료" });
    } catch (err) {
        console.error("트랜잭션 저장 실패:", err);
        res.status(500).json({ error: "트랜잭션 저장 실패" });
    }
});

// POST /api/tokens : 새로운 토큰 등록 + 실시간 추가 전송
app.post('/api/tokens', async (req, res) => {
    const { token_address, name, symbol, created_at, raised_funds, volume } = req.body;
    try {
        const connection = await pool.getConnection();
        await connection.query(
            'INSERT INTO tokens (token_address, name, symbol, created_at, raised_funds, volume) VALUES (?, ?, ?, ?, ?, ?)',
            [token_address, name, symbol, created_at, parseFloat(raised_funds) || 0, parseFloat(volume) || 0]
        );
        connection.release();

        io.emit("newToken", {
            token_address,
            name,
            symbol,
            created_at,
            raised_funds: `${raised_funds} BNB`,
            volume: `${volume} BNB`
        });

        res.status(201).json({ message: "토큰 저장 완료" });
    } catch (err) {
        console.error("토큰 저장 실패:", err);
        res.status(500).json({ error: "토큰 저장 실패" });
    }
});

// GET /api/tokens : 전체 토큰 목록 조회
app.get('/api/tokens', async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query('SELECT * FROM tokens ORDER BY created_at DESC');
        connection.release();

        const formatted = rows.map(row => ({
            ...row,
            raised_funds: `${row.raised_funds} BNB`,
            volume: `${row.volume} BNB`
        }));

        res.json(formatted);
    } catch (err) {
        console.error("토큰 목록 조회 실패:", err);
        res.status(500).json({ error: "토큰 목록 조회 실패" });
    }
});

// POST /api/updateFunds : 프리세일 모금액 / 거래량 갱신 + 실시간 반영
app.post('/api/updateFunds', async (req, res) => {
    const { tokenAddress, raisedFunds, volume, type } = req.body;
    try {
        const connection = await pool.getConnection();

        if (type === "buy") {
            await connection.query(
                'UPDATE tokens SET raised_funds = raised_funds + ? WHERE token_address = ?',
                [parseFloat(raisedFunds), tokenAddress]
            );
        } else if (type === "sell") {
            await connection.query(
                'UPDATE tokens SET volume = volume + ? WHERE token_address = ?',
                [parseFloat(volume), tokenAddress]
            );
        }

        const [updated] = await connection.query(
            'SELECT * FROM tokens WHERE token_address = ?',
            [tokenAddress]
        );
        connection.release();

        const updatedToken = updated[0];
        io.emit("updateToken", {
            token_address: updatedToken.token_address,
            raised_funds: `${updatedToken.raised_funds} BNB`,
            volume: `${updatedToken.volume} BNB`
        });

        res.status(200).json({ message: "업데이트 완료" });
    } catch (err) {
        console.error("자금 업데이트 실패:", err);
        res.status(500).json({ error: "자금 업데이트 실패" });
    }
});

// GET /api/transactions/:tokenAddress : 특정 토큰 트랜잭션 조회
app.get('/api/transactions/:tokenAddress', async (req, res) => {
    const { tokenAddress } = req.params;
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query(
            'SELECT * FROM transactions WHERE token_address = ? ORDER BY timestamp DESC',
            [tokenAddress]
        );
        connection.release();
        res.json(rows);
    } catch (err) {
        console.error("트랜잭션 조회 실패:", err);
        res.status(500).json({ error: "트랜잭션 조회 실패" });
    }
});

// 서버 실행
const PORT = 5000;
server.listen(PORT, () => {
    console.log(`✅ 서버가 포트 ${PORT}에서 실행 중입니다.`);
});
