// Vercel Serverless Function / API Handler
const fs = require('fs');
const path = require('path');

// 内存中的简易存储（供 Vercel Serverless 场景）或配合 Vercel KV / Database
let memoryMessages = [
    {
        id: "init-1",
        author: "系统小助手",
        content: "欢迎来到九维空间的留言板！接口已成功升级 🎉",
        createdAt: new Date().toISOString()
    }
];

module.exports = (req, res) => {
    // 设置 CORS 跨域头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method === 'GET') {
        return res.status(200).json(memoryMessages);
    }

    if (req.method === 'POST') {
        const { author, content } = req.body || {};
        if (!content || typeof content !== 'string' || !content.trim()) {
            return res.status(400).json({ error: '留言内容不能为空' });
        }
        if (content.length > 500) {
            return res.status(400).json({ error: '留言内容不能超过500字' });
        }

        const newMessage = {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            author: (author && author.trim()) ? author.trim().substring(0, 20) : '匿名用户',
            content: content.trim(),
            createdAt: new Date().toISOString()
        };

        memoryMessages.unshift(newMessage); // 最新留言在前
        return res.status(201).json({ success: true, message: '留言成功', data: newMessage });
    }

    res.status(405).json({ error: 'Method not allowed' });
};
