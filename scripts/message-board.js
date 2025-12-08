// message-board.js - 留言板功能逻辑
// 初始化 LeanCloud (请确保在调用任何AV方法前，此代码已执行)
(function initLeanCloud() {
    const APP_ID = '4oNT3kc8u2ZyRBHTCXkVkr88-gzGzoHsz';
    const APP_KEY = 'r1OWnFQNbJ7iJHgusSGtQfem';
    AV.init({
        appId: APP_ID,
        appKey: APP_KEY,
        serverURLs: 'https://4ont3kc8.lc-cn-n1-shared.com'
    });
})();

const Message = AV.Object.extend('Message');

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
        const query = new AV.Query('Message');
        query.descending('createdAt');
        const messages = await query.find();

        if (messages.length === 0) {
            container.innerHTML = '<div class="no-messages">还没有留言，快来第一个留言吧！</div>';
            return;
        }

        let html = '';
        messages.forEach(msg => {
            const time = new Date(msg.get('createdAt')).toLocaleString('zh-CN');
            html += `
                    <div class="message-item" data-id="${msg.id}">
                        <div class="message-header">
                            <span class="message-author">${escapeHtml(msg.get('author') || '匿名用户')}</span>
                            <span class="message-time">${time}</span>
                        </div>
                        <div class="message-content">${escapeHtml(msg.get('content'))}</div>
                    </div>
                `;
        });
        container.innerHTML = html;
    } catch (error) {
        console.error('加载留言失败:', error);
        showMessage('error', '加载留言失败: ' + (error.message || '未知错误'));
        container.innerHTML = '<div class="no-messages">加载留言失败，请检查控制台或刷新重试</div>';
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
        const message = new Message();
        message.set('author', author || '匿名用户');
        message.set('content', content);
        await message.save();

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
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    // 仅当在留言板页面时才执行相关初始化
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