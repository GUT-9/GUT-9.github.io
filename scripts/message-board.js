// message-board.js - 留言板功能逻辑
// 浏览器 -> gut9.cn/api/messages
// -> EdgeOne -> Netlify -> Supabase

const MESSAGE_API =
    '/api/messages';

function showMessage(type, text) {
    const element =
        document.getElementById(
            type + 'Message'
        );

    if (!element) return;

    element.textContent = text;
    element.style.display = 'block';

    setTimeout(function () {
        element.style.display = 'none';
    }, 5000);
}


// =============================================================
// 加载留言
// =============================================================
async function loadMessages() {
    const container =
        document.getElementById(
            'messagesContainer'
        );

    if (!container) return;

    try {
        const response =
            await fetch(
                MESSAGE_API,
                {
                    method: 'GET',

                    headers: {
                        'Accept':
                            'application/json'
                    },

                    cache:
                        'no-store'
                }
            );

        if (!response.ok) {
            throw new Error(
                '网络响应错误 HTTP ' +
                response.status
            );
        }

        const messages =
            await response.json();

        if (
            !messages ||
            messages.length === 0
        ) {
            container.innerHTML =
                '<div class="no-messages">' +
                '还没有留言，快来第一个留言吧！' +
                '</div>';

            return;
        }

        let html = '';

        messages.forEach(function (msg) {
            const rawTime =
                msg.created_at ||
                msg.createdAt;

            const time =
                rawTime
                    ? new Date(
                        rawTime
                    ).toLocaleString(
                        'zh-CN'
                    )
                    : '未知时间';

            html +=
                '<div class="message-item" data-id="' +
                escapeHtml(
                    String(
                        msg.id || ''
                    )
                ) +
                '">' +

                    '<div class="message-header">' +

                        '<span class="message-author">' +
                            escapeHtml(
                                msg.author ||
                                '匿名用户'
                            ) +
                        '</span>' +

                        '<span class="message-time">' +
                            escapeHtml(time) +
                        '</span>' +

                    '</div>' +

                    '<div class="message-content">' +
                        escapeHtml(
                            msg.content ||
                            ''
                        ) +
                    '</div>' +

                '</div>';
        });

        container.innerHTML =
            html;

    } catch (error) {
        console.error(
            '加载留言失败:',
            error
        );

        showMessage(
            'error',
            '加载留言失败: ' +
            (
                error.message ||
                '未知错误'
            )
        );

        container.innerHTML =
            '<div class="no-messages">' +
            '加载留言失败，请刷新重试' +
            '</div>';
    }
}


// =============================================================
// 发布留言
// =============================================================
async function submitMessage(
    author,
    content
) {
    const btn =
        document.getElementById(
            'submitBtn'
        );

    const btnText =
        document.getElementById(
            'btnText'
        );

    const btnLoading =
        document.getElementById(
            'btnLoading'
        );

    if (!btn) return;

    btn.disabled =
        true;

    if (btnText) {
        btnText.textContent =
            '发布中...';
    }

    if (btnLoading) {
        btnLoading.style.display =
            'inline-block';
    }

    try {
        const response =
            await fetch(
                MESSAGE_API,
                {
                    method:
                        'POST',

                    headers: {
                        'Content-Type':
                            'application/json',

                        'Accept':
                            'application/json'
                    },

                    body:
                        JSON.stringify({
                            author:
                                author ||
                                '匿名用户',

                            content:
                                content
                        })
                }
            );

        if (!response.ok) {
            let errData = {};

            try {
                errData =
                    await response.json();
            } catch (_) {}

            throw new Error(
                errData.error ||
                errData.message ||
                (
                    'HTTP ' +
                    response.status
                )
            );
        }

        showMessage(
            'success',
            '留言发布成功！'
        );

        const form =
            document.getElementById(
                'messageForm'
            );

        if (form) {
            form.reset();
        }

        await loadMessages();

    } catch (error) {
        console.error(
            '发布留言失败:',
            error
        );

        showMessage(
            'error',
            '留言发布失败: ' +
            (
                error.message ||
                '未知错误'
            )
        );

    } finally {
        btn.disabled =
            false;

        if (btnText) {
            btnText.textContent =
                '发布留言';
        }

        if (btnLoading) {
            btnLoading.style.display =
                'none';
        }
    }
}


// =============================================================
// HTML 转义
// =============================================================
function escapeHtml(text) {
    if (!text) {
        return '';
    }

    const div =
        document.createElement(
            'div'
        );

    div.textContent =
        String(text);

    return div.innerHTML;
}


// =============================================================
// 页面初始化
// =============================================================
document.addEventListener(
    'DOMContentLoaded',
    function () {
        const form =
            document.getElementById(
                'messageForm'
            );

        if (!form) {
            return;
        }

        loadMessages();

        form.addEventListener(
            'submit',
            function (e) {
                e.preventDefault();

                const authorElement =
                    document.getElementById(
                        'author'
                    );

                const contentElement =
                    document.getElementById(
                        'content'
                    );

                const author =
                    authorElement
                        ? authorElement
                            .value
                            .trim()
                        : '';

                const content =
                    contentElement
                        ? contentElement
                            .value
                            .trim()
                        : '';

                if (!content) {
                    showMessage(
                        'error',
                        '请输入留言内容！'
                    );

                    return;
                }

                if (
                    content.length >
                    500
                ) {
                    showMessage(
                        'error',
                        '留言内容不能超过500字！'
                    );

                    return;
                }

                submitMessage(
                    author,
                    content
                );
            }
        );
    }
);
