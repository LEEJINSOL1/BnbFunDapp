const express = require('express');
const cors = require('cors');
const sequelize = require('./config/database');
const tokenRoutes = require('./routes/tokenRoutes');

const app = express();

app.use(cors());
app.use(express.json());

// 라우트 설정
app.use('/tokens', tokenRoutes);

// 데이터베이스 동기화
sequelize.sync({ force: true }).then(() => {
  console.log('Database synced');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});