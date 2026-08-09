// message-board.js - 留言板功能逻辑 (Supabase 云数据库直连版)

const SUPABASE_URL = 'https://iiqjggvsbaidfenbpngz.supabase.co';
const SUPABASE_KEY = 'sb_publishable_nyp_bErLHoI3Ds-2afZ2gw_DwLbDF9O';

const HEADERS = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
};

function showMessage(type, text) {
    const element = document.getElementById(type + 'Message');
    if (!element) return;
    element.textContent = text;
    element.style.display = 'block';
    setTimeout(() => { element.style.display = 'none'; }, 5000);
}

async function loadMessages() {
    const container = document.getElementById('messagesContainer');
    if (!container) return;
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/messages?select=*&order=created_at.desc`, {
            method: 'GET',
            headers: HEADERS
        });

        if (!response.ok) {
            throw new Error(`网络响应错误 HTTP ${response.status}`);
        }
        const messages = await response.json();

        if (!messages || messages.length === 0) {
            container.innerHTML = '<div class="no-messages">还没有留言，快来第一个留言吧！</div>';
            return;
        }

        let html = '';
        messages.forEach(msg => {
            const rawTime = msg.created_at || msg.createdAt;
            const time = rawTime ? new Date(rawTime).toLocaleString('zh-CN') : '未知时间';
            html += `
                <div class="message-item" data-id="${msg.id}">
                    <div class="message-header">
                        <span class="message-author">${escapeHtml(msg.author || '匿名用户')}</span>
                        <span class="message-time">${time}</span>
                    </div>
                    <div class="message-content">${escapeHtml(msg.content)}</div>
                </div>
            `;
        });
        container.innerHTML = html;
    } catch (error) {
        console.error('加载留言失败:', error);
        showMessage('error', '加载留言失败: ' + (error.message || '未知错误'));
        container.innerHTML = '<div class="no-messages">加载留言失败，请刷新重试</div>';
    }
}

async function submitMessage(author, content) {
    const btn = document.getElementById('submitBtn');
    const btnText = document.getElementById('btnText');
    const btnLoading = document.getElementById('btnLoading');
    if (!btn) return;

    btn.disabled = true;
    btnText.textContent = '发布中...';
    btnLoading.style.display = 'inline-block';

    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/messages`, {
            method: 'POST',
            headers: HEADERS,
            body: JSON.stringify({
                author: author || '匿名用户',
                content: content
            })
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.message || `HTTP ${response.status}`);
        }

        showMessage('success', '留言发布成功！');
        document.getElementById('messageForm').reset();
        await loadMessages();
    } catch (error) {
        console.error('发布留言失败:', error);
        showMessage('error', '留言发布失败: ' + (error.message || '未知错误'));
    } finally {
        btn.disabled = false;
        btnText.textContent = '发布留言';
        btnLoading.style.display = 'none';
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('messageForm')) {
        loadMessages();

        document.getElementById('messageForm').addEventListener('submit', function(e) {
            e.preventDefault();
            const author = document.getElementById('author').value.trim();
            const content = document.getElementById('content').value.trim();

            if (!content) {
                showMessage('error', '请输入留言内容！');
                return;
            }
            if (content.length > 500) {
                showMessage('error', '留言内容不能超过500字！');
                return;
            }
            submitMessage(author, content);
        });
    }
});