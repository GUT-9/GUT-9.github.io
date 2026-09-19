(function () {
    "use strict";

    const ANALYTICS_ENDPOINT = "/api/collect";

    const VISITOR_KEY = "gut9_visitor_id";
    const SESSION_KEY = "gut9_session";
    const SESSION_TIMEOUT = 30 * 60 * 1000;


    function getVisitorId() {
        let id = localStorage.getItem(VISITOR_KEY);

        if (!id) {
            id = crypto.randomUUID();
            localStorage.setItem(VISITOR_KEY, id);
        }

        return id;
    }


    function getLocation() {
    return new Promise((resolve) => {

        if (!navigator.geolocation) {
            resolve({
                status: "unsupported"
            });
            return;
        }

        navigator.geolocation.getCurrentPosition(

            (position) => {
                resolve({
                    status: "granted",

                    latitude:
                        position.coords.latitude,

                    longitude:
                        position.coords.longitude,

                    accuracy:
                        position.coords.accuracy
                });
            },

            (error) => {
                let status = "failed";

                if (error.code === 1) {
                    status = "denied";
                } else if (error.code === 2) {
                    status = "unavailable";
                } else if (error.code === 3) {
                    status = "timeout";
                }

                resolve({
                    status: status
                });
            },

            {
                // 请求尽可能高精度的位置
                enableHighAccuracy: true,

                // 最多等 10 秒
                timeout: 10000,

                // 尽量不要使用旧缓存位置
                maximumAge: 0
            }
        );
    });
}


    // =========================================================
    // 获取浏览器真实定位
    // =========================================================
    function getLocation() {
        return new Promise((resolve) => {

            if (!navigator.geolocation) {
                resolve({
                    status: "unsupported"
                });
                return;
            }

            navigator.geolocation.getCurrentPosition(

                // 用户允许，并成功取得定位
                (position) => {
                    resolve({
                        status: "granted",

                        latitude:
                            position.coords.latitude,

                        longitude:
                            position.coords.longitude,

                        accuracy:
                            position.coords.accuracy
                    });
                },

                // 用户拒绝、超时或定位失败
                (error) => {
                    let status = "failed";

                    if (error.code === 1) {
                        status = "denied";
                    } else if (error.code === 2) {
                        status = "unavailable";
                    } else if (error.code === 3) {
                        status = "timeout";
                    }

                    resolve({
                        status: status
                    });
                },

                {
                    // 城市级定位足够
                    enableHighAccuracy: false,

                    // 最多等待 8 秒
                    timeout: 8000,

                    // 允许使用 10 分钟内的缓存定位
                    maximumAge: 10 * 60 * 1000
                }
            );
        });
    }


    async function sendAnalytics() {
        try {

            // 先请求一次浏览器定位
            const location =
                await getLocation();

            const payload = {
                visitor_id:
                    getVisitorId(),

                session_id:
                    getSessionId(),

                path:
                    window.location.pathname,

                title:
                    document.title,

                referrer:
                    document.referrer || "",

                language:
                    navigator.language || "",

                screen_width:
                    window.screen.width,

                screen_height:
                    window.screen.height,

                // 定位权限状态
                location_status:
                    location.status,

                // 只有授权成功时才有这些字段
                gps_latitude:
                    location.latitude ?? null,

                gps_longitude:
                    location.longitude ?? null,

                gps_accuracy:
                    location.accuracy ?? null
            };


            const response =
                await fetch(
                    ANALYTICS_ENDPOINT,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(payload),

                        keepalive: true
                    }
                );


            if (!response.ok) {
                console.warn(
                    "GUT9 Analytics:",
                    response.status,
                    await response.text()
                );
            }

        } catch (error) {
            console.debug(
                "GUT9 Analytics unavailable:",
                error
            );
        }
    }


    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            sendAnalytics
        );
    } else {
        sendAnalytics();
    }

})();
