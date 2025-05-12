require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] },
    pingTimeout: 60000,
    pingInterval: 25000
});

app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'Dlwlsthf1@',
    database: 'bnb_fund_dapp',
    dateStrings: true,
    connectionLimit: 10,
});

const cache = new Map();
const CACHE_TTL = 60 * 1000;
function setCache(key, value) {
    cache.set(key, { value, expiry: Date.now() + CACHE_TTL });
}
function getCache(key) {
    const cached = cache.get(key);
    if (!cached) return null;
    if (Date.now() > cached.expiry) {
        cache.delete(key);
        return null;
    }
    return cached.value;
}

io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);
    socket.on("joinTokenRoom", (tokenAddress) => {
        socket.join(tokenAddress);
        console.log(`Socket ${socket.id} joined room: ${tokenAddress}`);
        pool.query(
            'SELECT * FROM candlesticks WHERE token_address = ? ORDER BY candle_time DESC LIMIT 1',
            [tokenAddress]
        ).then(([rows]) => {
            if (rows.length > 0) {
                const ts = Math.floor(new Date(rows[0].candle_time + 'Z').getTime() / 1000);
                const latestCandle = {
                    time: ts,
                    open: parseFloat(rows[0].open),
                    high: parseFloat(rows[0].high),
                    low: parseFloat(rows[0].low),
                    close: parseFloat(rows[0].close),
                    raised_funds: parseFloat(rows[0].raised_funds),
                    volume: parseFloat(rows[0].volume)
                };
                socket.emit("latestCandle", latestCandle);
                console.log(`Sent latestCandle to ${socket.id}:`, latestCandle);
            }
        }).catch(err => {
            console.error(`Error sending latestCandle to ${socket.id}:`, err);
        });
    });
    socket.on("disconnect", () => {
        console.log(`Socket disconnected: ${socket.id}`);
    });
});

app.post('/api/transactions', async (req, res) => {
    const { token_address, type, token_amount, bnb_value, timestamp } = req.body;
    let connection;
    try {
        // UTC 강제 파싱
        const parsedTimestamp = new Date(timestamp.endsWith('Z') ? timestamp : timestamp + 'Z');
        if (isNaN(parsedTimestamp.getTime())) {
            throw new Error("유효하지 않은 timestamp 형식");
        }
        // 미래 시간 검증 (최대 1분)
        if (parsedTimestamp.getTime() > Date.now() + 60 * 1000) {
            throw new Error(`미래 시간 불허: ${parsedTimestamp.toISOString()}`);
        }
        // DB 저장용 UTC 문자열
        const utcTimestamp = parsedTimestamp.toISOString().slice(0,19).replace('T',' ');
        // 5분봉 계산 (UTC 기준)
        const flooredUtcMs = Math.floor(parsedTimestamp.getTime() / (5 * 60 * 1000)) * (5 * 60 * 1000);
        const candleTimeStr = new Date(flooredUtcMs).toISOString().slice(0,19).replace('T',' ');

        connection = await pool.getConnection();
        await connection.beginTransaction();

        // 1) transactions 테이블에 삽입
        await connection.query(
            'INSERT INTO transactions (token_address, type, token_amount, bnb_value, timestamp) VALUES (?, ?, ?, ?, ?)',
            [token_address, type, token_amount, bnb_value, utcTimestamp]
        );

        const bnbValue = parseFloat(bnb_value);
        // 2) 5분봉 조회
        const [existing] = await connection.query(
            'SELECT * FROM candlesticks WHERE token_address = ? AND candle_time = ?',
            [token_address, candleTimeStr]
        );

        let updatedCandle;
        if (existing.length > 0) {
            const c = existing[0];
            const newRaised = parseFloat(c.raised_funds) + (type === 'buy' ? bnbValue : -bnbValue);
            const newVol    = parseFloat(c.volume)      + (type === 'sell' ? bnbValue : 0);
            const newHigh   = Math.max(parseFloat(c.high), newRaised);
            const newLow    = Math.min(parseFloat(c.low),  newRaised);

            await connection.query(
                'UPDATE candlesticks SET high=?, low=?, close=?, raised_funds=?, volume=? WHERE token_address=? AND candle_time=?',
                [newHigh, newLow, newRaised, newRaised, newVol, token_address, candleTimeStr]
            );
            updatedCandle = {
                time: Math.floor(flooredUtcMs / 1000),
                open: parseFloat(c.open),
                high: newHigh,
                low: newLow,
                close: newRaised,
                raised_funds: newRaised,
                volume: newVol
            };
        } else {
            const openVal = type === 'buy' ? bnbValue : -bnbValue;
            const vol     = type === 'sell' ? bnbValue : 0;

            await connection.query(
                'INSERT INTO candlesticks (token_address, candle_time, open, high, low, close, raised_funds, volume) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [token_address, candleTimeStr, openVal, openVal, openVal, openVal, openVal, vol]
            );
            updatedCandle = {
                time: Math.floor(flooredUtcMs / 1000),
                open: openVal,
                high: openVal,
                low: openVal,
                close: openVal,
                raised_funds: openVal,
                volume: vol
            };
        }

        await connection.commit();

        // 3) 실시간 전파
        io.to(token_address).emit("newTransaction", {
            token_address,
            type,
            token_amount,
            bnb_value,
            timestamp: utcTimestamp,
            id: `${token_address}-${Date.now()}`,
            updatedCandle
        });

        // 4) 캐시 무효화
        for (const key of cache.keys()) {
            if (key.includes(token_address)) {
                cache.delete(key);
            }
        }

        // 5) tokens 테이블 업데이트
        if (type === "buy") {
            await pool.query(
                'UPDATE tokens SET raised_funds = raised_funds + ? WHERE token_address = ?',
                [bnbValue, token_address]
            );
        } else {
            await pool.query(
                'UPDATE tokens SET raised_funds = raised_funds - ?, volume = volume + ? WHERE token_address = ?',
                [bnbValue, bnbValue, token_address]
            );
        }

        const [updTokens] = await connection.query(
            'SELECT * FROM tokens WHERE token_address = ?',
            [token_address]
        );
        const tok = updTokens[0];
        io.emit("updateToken", {
            token_address: tok.token_address,
            raised_funds: `${tok.raised_funds} BNB`,
            volume: `${tok.volume} BNB`
        });

        res.status(201).json({ message: "트랜잭션 저장 완료" });
    } catch (err) {
        console.error("트랜잭션 저장 실패:", err);
        if (connection) await connection.rollback();
        res.status(500).json({ error: err.message || "트랜잭션 저장 실패" });
    } finally {
        if (connection) connection.release();
    }
});

app.get('/api/candlestick/:tokenAddress', async (req, res) => {
    const { tokenAddress } = req.params;
    const since = req.query.since
        || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
             .toISOString().slice(0, 19).replace('T', ' ');
    const interval = req.query.interval || '5m';
    const cacheKey = `candlestick:${tokenAddress}:${since}:${interval}`;
    let connection;

    try {
        const cached = getCache(cacheKey);
        if (cached) {
            console.log(`[CACHE HIT] ${cacheKey}`);
            return res.json(cached);
        }

        connection = await pool.getConnection();
        let query;
        const params = [tokenAddress, since];

        if (interval === '5m') {
            query = `
                SELECT
                    UNIX_TIMESTAMP(candle_time) AS time,
                    open, high, low, close, raised_funds, volume
                FROM candlesticks
                WHERE token_address = ? AND candle_time >= ?
                ORDER BY candle_time
            `;
        } else {
            // 모든 interval 을 초 단위로 그룹핑
            const intervalSeconds = {
                '1m':  60,
                '15m': 15 * 60,
                '1h':  3600,
                '1d':  24 * 3600
            }[interval] || 5 * 60;

            query = `
                SELECT
                    FLOOR(UNIX_TIMESTAMP(timestamp) / ${intervalSeconds})
                      * ${intervalSeconds} AS time,
                    SUM(
                        CASE
                            WHEN type='buy'  THEN bnb_value
                            WHEN type='sell' THEN -bnb_value
                            ELSE 0
                        END
                    ) AS raised_funds,
                    SUM(
                        CASE
                            WHEN type='sell' THEN bnb_value
                            ELSE 0
                        END
                    ) AS volume
                FROM transactions
                WHERE token_address = ? AND timestamp >= ?
                GROUP BY time
                ORDER BY time
            `;
        }

        const [rows] = await connection.query(query, params);

        let cumulative = 0;
        const formatted = rows.map((row, idx) => {
            const rf = parseFloat(row.raised_funds) || 0;
            cumulative += rf;
            const prev = idx === 0 ? 0 : cumulative - rf;
            return {
                time: parseInt(row.time),
                open: prev,
                high: Math.max(prev, cumulative),
                low: Math.min(prev, cumulative),
                close: cumulative,
                raised_funds: cumulative,
                volume: parseFloat(row.volume) || 0
            };
        });

        setCache(cacheKey, formatted);
        res.json(formatted);
    } catch (err) {
        console.error("캔들스틱 데이터 조회 실패:", err);
        res.status(500).json({ error: "캔들스틱 데이터 조회 실패" });
    } finally {
        if (connection) connection.release();
    }
});

app.post('/api/tokens', async (req, res) => {
    const { token_address, name, symbol, created_at, raised_funds, volume } = req.body;
    let connection;
    try {
        connection = await pool.getConnection();
        await connection.query(
            'INSERT INTO tokens (token_address, name, symbol, created_at, raised_funds, volume) VALUES (?, ?, ?, ?, ?, ?)',
            [token_address, name, symbol, created_at, parseFloat(raised_funds) || 0, parseFloat(volume) || 0]
        );
        io.emit("newToken", {
            token_address, name, symbol, created_at,
            raised_funds: `${raised_funds} BNB`,
            volume: `${volume} BNB`
        });
        res.status(201).json({ message: "토큰 저장 완료" });
    } catch (err) {
        console.error("토큰 저장 실패:", err);
        res.status(500).json({ error: "토큰 저장 실패" });
    } finally {
        if (connection) connection.release();
    }
});

app.get('/api/tokens', async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();
        const [rows] = await connection.query('SELECT * FROM tokens ORDER BY created_at DESC');
        const formatted = rows.map(row => ({
            token_address: row.token_address,
            name: row.name,
            symbol: row.symbol,
            created_at: row.created_at,
            raised_funds: `${row.raised_funds} BNB`,
            volume: `${row.volume} BNB`
        }));
        res.json(formatted);
    } catch (err) {
        console.error("토큰 목록 조회 실패:", err);
        res.status(500).json({ error: "토큰 목록 조회 실패" });
    } finally {
        if (connection) connection.release();
    }
});

app.post('/api/updateFunds', async (req, res) => {
    const { tokenAddress, raisedFunds, volume, type } = req.body;
    let connection;
    try {
        connection = await pool.getConnection();
        if (type === "buy") {
            await connection.query(
                'UPDATE tokens SET raised_funds = raised_funds + ? WHERE token_address = ?',
                [parseFloat(raisedFunds), tokenAddress]
            );
        } else if (type === "sell") {
            await connection.query(
                'UPDATE tokens SET raised_funds = raised_funds - ?, volume = volume + ? WHERE token_address = ?',
                [parseFloat(raisedFunds), parseFloat(volume), tokenAddress]
            );
        }
        const [updated] = await connection.query(
            'SELECT * FROM tokens WHERE token_address = ?',
            [tokenAddress]
        );
        const t = updated[0];
        io.emit("updateToken", {
            token_address: t.token_address,
            raised_funds: `${t.raised_funds} BNB`,
            volume: `${t.volume} BNB`
        });
        res.status(200).json({ message: "업데이트 완료" });
    } catch (err) {
        console.error("자금 업데이트 실패:", err);
        res.status(500).json({ error: "자금 업데이트 실패" });
    } finally {
        if (connection) connection.release();
    }
});

app.get('/api/transactions/:tokenAddress', async (req, res) => {
    const { tokenAddress } = req.params;
    let connection;
    try {
        connection = await pool.getConnection();
        const [rows] = await connection.query(
            'SELECT token_address, type, token_amount, bnb_value, timestamp FROM transactions WHERE token_address = ? ORDER BY timestamp DESC LIMIT 100',
            [tokenAddress]
        );
        res.json(rows);
    } catch (err) {
        console.error("트랜잭션 조회 실패:", err);
        res.status(500).json({ error: "트랜잭션 조회 실패" });
    } finally {
        if (connection) connection.release();
    }
});

const PORT = 5000;
server.listen(PORT, () => {
    console.log(`✅ 서버가 포트 ${PORT}에서 실행 중입니다.`);
});
