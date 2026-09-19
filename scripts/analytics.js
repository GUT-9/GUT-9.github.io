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

  function getSessionId() {
    const now = Date.now();
    let session = null;

    try {
      session = JSON.parse(
        localStorage.getItem(SESSION_KEY)
      );
    } catch {}

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
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
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
            status
          });
        },

        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  }

  async function postJson(data) {
    const response = await fetch(
      ANALYTICS_ENDPOINT,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body: JSON.stringify(data),

        keepalive: true
      }
    );

    if (!response.ok) {
      throw new Error(
        "HTTP " +
        response.status
      );
    }

    return response;
  }

  function sendBeaconFallback(data) {
    try {
      if (!navigator.sendBeacon) {
        return false;
      }

      const blob = new Blob(
        [
          JSON.stringify(data)
        ],
        {
          type:
            "application/json"
        }
      );

      return navigator.sendBeacon(
        ANALYTICS_ENDPOINT,
        blob
      );

    } catch {
      return false;
    }
  }

  async function startAnalytics() {
    const visitorId =
      getVisitorId();

    const sessionId =
      getSessionId();

    const baseData = {
      visitor_id: visitorId,
      session_id: sessionId,

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
        window.screen.height
    };


    // =========================================================
    // 第一步：
    // 页面一打开马上记录访问。
    //
    // 完全不等待浏览器定位。
    // 这条访问也已经写进数据库。
    // =========================================================
    const firstRequest = {
      ...baseData,

      location_status:
        "pending",

      gps_latitude:
        null,

      gps_longitude:
        null,

      gps_accuracy:
        null
    };


    try {
      await postJson(
        firstRequest
      );

    } catch (error) {
      console.debug(
        "Analytics fetch failed:",
        error
      );

      // 某些手机浏览器在页面生命周期中
      // 对 fetch/keepalive 支持不好，
      // 再尝试 sendBeacon。
      sendBeaconFallback(
        firstRequest
      );

      // 基础访问都没有确认成功，
      // 不继续发送定位更新，避免顺序混乱。
      return;
    }


    // =========================================================
    // 第二步：
    // 基础访问已经保存以后，
    // 再单独向浏览器请求位置。
    // =========================================================
    const location =
      await getLocation();


    // 拒绝 / 超时 / 不支持：
    // 什么都不用再发。
    //
    // 第一条请求已经记录，
    // 后台会继续显示 IP 推测省份。
    if (
      location.status !==
      "granted"
    ) {
      return;
    }


    // =========================================================
    // 第三步：
    // 用户允许定位，
    // 第二次请求只更新位置。
    //
    // 不能增加 PV / Session。
    // =========================================================
    const locationUpdate = {
      visitor_id:
        visitorId,

      session_id:
        sessionId,

      location_update_only:
        true,

      location_status:
        "granted",

      gps_latitude:
        location.latitude,

      gps_longitude:
        location.longitude,

      gps_accuracy:
        location.accuracy
    };


    try {
      await postJson(
        locationUpdate
      );

    } catch (error) {
      console.debug(
        "Location update failed:",
        error
      );
    }
  }


  if (
    document.readyState ===
    "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      startAnalytics
    );
  } else {
    startAnalytics();
  }
})();
