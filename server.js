const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'messages.json');

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// 初始化数据文件
function getMessages() {
    if (!fs.existsSync(DATA_FILE)) {
        fs.writeFileSync(DATA_FILE, JSON.stringify([
            {
                id: "init-1",
                author: "系统小助手",
                content: "欢迎来到九维空间的留言板！旧接口已升级为全新的 Node.js 后端服务 🎉",
                createdAt: new Date().toISOString()
            }
        ], null, 2));
    }
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        return [];
    }
}

function saveMessages(messages) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(messages, null, 2));
}

// 获取留言列表
app.get('/api/messages', (req, res) => {
    const messages = getMessages();
    // 按时间倒序
    messages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(messages);
});

// 提交新留言
app.post('/api/messages', (req, res) => {
    const { author, content } = req.body;
    
    if (!content || typeof content !== 'string' || !content.trim()) {
        return res.status(400).json({ error: '留言内容不能为空' });
    }
    if (content.length > 500) {
        return res.status(400).json({ error: '留言内容不能超过500字' });
    }

    const messages = getMessages();
    const newMessage = {
        id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
        author: (author && author.trim()) ? author.trim().substring(0, 20) : '匿名用户',
        content: content.trim(),
        createdAt: new Date().toISOString()
    };

    messages.push(newMessage);
    saveMessages(messages);

    res.status(201).json({ success: true, message: '留言成功', data: newMessage });
});

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`留言板后端 API 服务已启动: http://localhost:${PORT}`);
    });
}

module.exports = app;
