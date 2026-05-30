const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Thư mục chứa các file giao diện (HTML, CSS, JS, ảnh...)
const publicDir = __dirname;

// Phục vụ file tĩnh
app.use(express.static(publicDir));

// Trang mặc định: portal chọn Admin / Người dùng
app.get('/', (req, res) => {
  res.sendFile(path.join(publicDir, 'dangnhap.html'));
});

app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});

