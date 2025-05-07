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
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'Dlwlsthf1@',
    database: 'bnb_fund_dapp',
    dateStrings: true,
});

io.on("connection", (socket) => {
    console.log("소켓 연결됨:", socket.id);

    socket.on("joinTokenRoom", (tokenAddress) => {
        socket.join(tokenAddress);
        console.log(`방 참여: ${tokenAddress} (소켓 ID: ${socket.id})`);
    });

    socket.on("disconnect", () => {
        console.log("소켓 연결 해제됨:", socket.id);
    });
});

app.post('/api/transactions', async (req, res) => {
    const { token_address, type, token_amount, bnb_value, timestamp } = req.body;
    try {
        // ✅ KST (UTC+9)로 변환
        const kstDate = new Date(new Date(timestamp).getTime() + 9 * 60 * 60 * 1000);
        const formattedTimestamp = kstDate.toISOString().slice(0, 19).replace('T', ' ');

        console.log("index.js - Saving transaction with timestamp (KST):", formattedTimestamp);

        const connection = await pool.getConnection();
        await connection.query(
            'INSERT INTO transactions (token_address, type, token_amount, bnb_value, timestamp) VALUES (?, ?, ?, ?, ?)',
            [token_address, type, token_amount, bnb_value, formattedTimestamp]
        );
        connection.release();

        const [savedTx] = await pool.query(
            'SELECT * FROM transactions WHERE token_address = ? ORDER BY timestamp DESC LIMIT 1',
            [token_address]
        );
        console.log("저장된 트랜잭션:", savedTx[0]);

        const newTransaction = {
            token_address,
            type,
            token_amount,
            bnb_value,
            timestamp: formattedTimestamp
        };
        io.to(token_address).emit("newTransaction", newTransaction);
        console.log(`newTransaction 이벤트 전송: ${token_address}`, newTransaction);

        if (type === "buy") {
            await pool.query(
                'UPDATE tokens SET raised_funds = raised_funds + ? WHERE token_address = ?',
                [parseFloat(bnb_value), token_address]
            );
        } else if (type === "sell") {
            await pool.query(
                'UPDATE tokens SET volume = volume + ? WHERE token_address = ?',
                [parseFloat(bnb_value), token_address]
            );
        }

        const [updated] = await pool.query(
            'SELECT * FROM tokens WHERE token_address = ?',
            [token_address]
        );
        const updatedToken = updated[0];
        io.emit("updateToken", {
            token_address: updatedToken.token_address,
            raised_funds: `${updatedToken.raised_funds} BNB`,
            volume: `${updatedToken.volume} BNB`
        });

        res.status(201).json({ message: "트랜잭션 저장 완료" });
    } catch (err) {
        console.error("트랜잭션 저장 실패:", err);
        res.status(500).json({ error: "트랜잭션 저장 실패" });
    }
});

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

app.get('/api/transactions/:tokenAddress', async (req, res) => {
    const { tokenAddress } = req.params;
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query(
            'SELECT * FROM transactions WHERE token_address = ? ORDER BY timestamp DESC',
            [tokenAddress]
        );
        connection.release();
        console.log("index.js - Transactions fetched (UTC):", rows);
        res.json(rows);
    } catch (err) {
        console.error("트랜잭션 조회 실패:", err);
        res.status(500).json({ error: "트랜잭션 조회 실패" });
    }
});

app.get('/api/candlestick/:tokenAddress', async (req, res) => {
    const { tokenAddress } = req.params;
    try {
        const connection = await pool.getConnection();

        const [rows] = await connection.query(
            `
            SELECT 
                DATE_FORMAT(timestamp, '%Y-%m-%d %H:%i:00') AS candle_time,
                CAST(SUBSTRING_INDEX(GROUP_CONCAT(bnb_value ORDER BY timestamp ASC), ',', 1) AS DECIMAL(18,8)) AS open,
                MAX(CAST(bnb_value AS DECIMAL(18,8))) AS high,
                MIN(CAST(bnb_value AS DECIMAL(18,8))) AS low,
                CAST(SUBSTRING_INDEX(GROUP_CONCAT(bnb_value ORDER BY timestamp DESC), ',', 1) AS DECIMAL(18,8)) AS close,
                SUM(CAST(bnb_value AS DECIMAL(18,8))) AS volume
            FROM transactions
            WHERE token_address = ?
            GROUP BY candle_time
            ORDER BY candle_time
            `,
            [tokenAddress]
        );
        connection.release();

        res.json(rows);
    } catch (err) {
        console.error("캔들스틱 데이터 조회 실패:", err);
        res.status(500).json({ error: "캔들스틱 데이터 조회 실패" });
    }
});

const PORT = 5000;
server.listen(PORT, () => {
    console.log(`✅ 서버가 포트 ${PORT}에서 실행 중입니다.`);
});
