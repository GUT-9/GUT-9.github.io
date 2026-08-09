const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const messagesHandler = require('./api/messages.js');

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

app.all('/api/messages', (req, res) => {
    messagesHandler(req, res);
});

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Supabase 驱动留言板 API 已启动: http://localhost:${PORT}`);
    });
}

module.exports = app;
