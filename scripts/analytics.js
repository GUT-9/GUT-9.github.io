(function () {
    "use strict";

    const ANALYTICS_ENDPOINT =
        "https://gut9-analytics.futianji0702.workers.dev/collect";

    const VISITOR_KEY = "gut9_visitor_id";
    const SESSION_KEY = "gut9_session";
    const SESSION_TIMEOUT = 30 * 60 * 1000; // 30分钟


    // 获取/创建设备（浏览器）ID
    function getVisitorId() {
        let id = localStorage.getItem(VISITOR_KEY);

        if (!id) {
            id = crypto.randomUUID();
            localStorage.setItem(VISITOR_KEY, id);
        }

        return id;
    }


    // 获取/创建 Session
    function getSessionId() {
        const now = Date.now();
        let session = null;

        try {
            session = JSON.parse(
                localStorage.getItem(SESSION_KEY)
            );
        } catch (e) {
            session = null;
        }

        // 第一次访问，或者超过30分钟没有活动
        if (
            !session ||
            !session.id ||
            !session.last_active ||
            now - session.last_active > SESSION_TIMEOUT
        ) {
            session = {
                id: crypto.randomUUID(),
                last_active: now
            };
        } else {
            session.last_active = now;
        }

        localStorage.setItem(
            SESSION_KEY,
            JSON.stringify(session)
        );

        return session.id;
    }


    async function sendAnalytics() {
        try {
            const payload = {
                visitor_id: getVisitorId(),
                session_id: getSessionId(),

                path: window.location.pathname,
                title: document.title,
                referrer: document.referrer || "",

                language: navigator.language || "",

                screen_width: window.screen.width,
                screen_height: window.screen.height
            };

            const response = await fetch(
                ANALYTICS_ENDPOINT,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify(payload),

                    // 页面关闭时尽量继续完成请求
                    keepalive: true
                }
            );

            // 调试阶段保留
            if (!response.ok) {
                console.warn(
                    "GUT9 Analytics:",
                    response.status,
                    await response.text()
                );
            }

        } catch (error) {
            // 统计系统出问题不能影响个人网站
            console.debug(
                "GUT9 Analytics unavailable:",
                error
            );
        }
    }


    // 页面加载完成后统计一次
    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            sendAnalytics
        );
    } else {
        sendAnalytics();
    }

})();