(function () {
    "use strict";

    const ANALYTICS_ENDPOINT = "/api/collect";

    const VISITOR_KEY = "gut9_visitor_id";
    const SESSION_KEY = "gut9_session";

    const SESSION_TIMEOUT =
        30 * 60 * 1000;


    // =========================================================
    // Visitor ID
    // =========================================================
    function getVisitorId() {

        let id =
            localStorage.getItem(
                VISITOR_KEY
            );

        if (!id) {
            id =
                crypto.randomUUID();

            localStorage.setItem(
                VISITOR_KEY,
                id
            );
        }

        return id;
    }


    // =========================================================
    // Session ID
    // =========================================================
    function getSessionId() {

        const now =
            Date.now();

        let session =
            null;

        try {
            session =
                JSON.parse(
                    localStorage.getItem(
                        SESSION_KEY
                    )
                );
        } catch (e) {
            session =
                null;
        }


        if (
            !session ||
            !session.id ||
            !session.last_active ||
            now -
                session.last_active >
                SESSION_TIMEOUT
        ) {

            session = {
                id:
                    crypto.randomUUID(),

                last_active:
                    now
            };

        } else {

            session.last_active =
                now;
        }


        localStorage.setItem(
            SESSION_KEY,
            JSON.stringify(
                session
            )
        );

        return session.id;
    }


    // =========================================================
    // 获取浏览器定位
    //
    // enableHighAccuracy = true
    // 尽量使用 GPS / Wi-Fi 等更高精度定位
    //
    // 用户拒绝不会导致统计失败，
    // 后端会自动退回 IP 省份定位。
    // =========================================================
    function getLocation() {

        return new Promise(
            (resolve) => {

                if (
                    !navigator.geolocation
                ) {
                    resolve({
                        status:
                            "unsupported"
                    });

                    return;
                }


                navigator.geolocation
                    .getCurrentPosition(

                        // -----------------------------
                        // 定位成功
                        // -----------------------------
                        (position) => {

                            resolve({
                                status:
                                    "granted",

                                latitude:
                                    position
                                        .coords
                                        .latitude,

                                longitude:
                                    position
                                        .coords
                                        .longitude,

                                accuracy:
                                    position
                                        .coords
                                        .accuracy
                            });

                        },


                        // -----------------------------
                        // 定位失败
                        // -----------------------------
                        (error) => {

                            let status =
                                "failed";


                            if (
                                error.code === 1
                            ) {
                                status =
                                    "denied";

                            } else if (
                                error.code === 2
                            ) {
                                status =
                                    "unavailable";

                            } else if (
                                error.code === 3
                            ) {
                                status =
                                    "timeout";
                            }


                            resolve({
                                status:
                                    status
                            });

                        },


                        // -----------------------------
                        // 定位参数
                        // -----------------------------
                        {
                            // 请求尽可能高的精度
                            enableHighAccuracy:
                                true,

                            // 最多等待 10 秒
                            timeout:
                                10000,

                            // 不使用旧缓存位置
                            maximumAge:
                                0
                        }
                    );
            }
        );
    }


    // =========================================================
    // 发送统计
    // =========================================================
    async function sendAnalytics() {

        try {

            // ---------------------------------------------
            // 先尝试获取位置
            // ---------------------------------------------
            const location =
                await getLocation();


            // ---------------------------------------------
            // 构造统计数据
            // ---------------------------------------------
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
                    document.referrer ||
                    "",

                language:
                    navigator.language ||
                    "",

                screen_width:
                    window.screen.width,

                screen_height:
                    window.screen.height,


                // -----------------------------------------
                // 定位
                // -----------------------------------------
                location_status:
                    location.status,

                gps_latitude:
                    location.latitude ??
                    null,

                gps_longitude:
                    location.longitude ??
                    null,

                // 单位：米
                gps_accuracy:
                    location.accuracy ??
                    null
            };


            // ---------------------------------------------
            // 发送
            // ---------------------------------------------
            const response =
                await fetch(
                    ANALYTICS_ENDPOINT,
                    {
                        method:
                            "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(
                                payload
                            ),

                        keepalive:
                            true
                    }
                );


            if (
                !response.ok
            ) {
                console.warn(
                    "GUT9 Analytics:",
                    response.status,
                    await response.text()
                );
            }

        } catch (error) {

            // 统计系统不能影响网站正常使用
            console.debug(
                "GUT9 Analytics unavailable:",
                error
            );
        }
    }


    // =========================================================
    // 页面加载完成后执行
    // =========================================================
    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            sendAnalytics
        );

    } else {

        sendAnalytics();
    }

})();
