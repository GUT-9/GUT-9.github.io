// Vercel Serverless Function - Supabase 数据库直连版
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://iiqjggvsbaidfenbpngz.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable_nyp_bErLHoI3Ds-2afZ2gw_DwLbDF9O';

module.exports = async (req, res) => {
    // 设置 CORS 跨域头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, apikey');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
    };

    // 1. 获取留言列表 GET /api/messages
    if (req.method === 'GET') {
        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/messages?select=*&order=created_at.desc`, {
                method: 'GET',
                headers
            });

            if (!response.ok) {
                const errText = await response.text();
                return res.status(response.status).json({ error: 'Supabase 读取失败: ' + errText });
            }

            const rows = await response.json();
            // 映射字段名适应前端
            const messages = rows.map(r => ({
                id: r.id,
                author: r.author || '匿名用户',
                content: r.content,
                createdAt: r.created_at || r.createdAt
            }));

            return res.status(200).json(messages);
        } catch (err) {
            console.error('Fetch error:', err);
            return res.status(500).json({ error: '服务器读取错误: ' + err.message });
        }
    }

    // 2. 提交新留言 POST /api/messages
    if (req.method === 'POST') {
        try {
            const { author, content } = req.body || {};
            if (!content || typeof content !== 'string' || !content.trim()) {
                return res.status(400).json({ error: '留言内容不能为空' });
            }
            if (content.length > 500) {
                return res.status(400).json({ error: '留言内容不能超过500字' });
            }

            const newRow = {
                author: (author && author.trim()) ? author.trim().substring(0, 20) : '匿名用户',
                content: content.trim()
            };

            const response = await fetch(`${SUPABASE_URL}/rest/v1/messages`, {
                method: 'POST',
                headers,
                body: JSON.stringify(newRow)
            });

            if (!response.ok) {
                const errText = await response.text();
                return res.status(response.status).json({ error: 'Supabase 保存失败: ' + errText });
            }

            const inserted = await response.json();
            const createdItem = Array.isArray(inserted) ? inserted[0] : newRow;

            return res.status(201).json({
                success: true,
                message: '留言成功',
                data: {
                    id: createdItem.id,
                    author: createdItem.author,
                    content: createdItem.content,
                    createdAt: createdItem.created_at || new Date().toISOString()
                }
            });
        } catch (err) {
            console.error('Insert error:', err);
            return res.status(500).json({ error: '服务器写入错误: ' + err.message });
        }
    }

    res.status(405).json({ error: 'Method not allowed' });
};
