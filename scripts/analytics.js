(function () {
  "use strict";

  var ENDPOINT = "/api/collect";
  var VISITOR_KEY = "gut9_visitor_id";
  var SESSION_KEY = "gut9_session";
  var SESSION_TIMEOUT = 30 * 60 * 1000;

  var baseRecorded = false;

  // =========================================================
  // 调试模式
  //
  // 地址后面加：
  // ?debug=analytics
  //
  // 手机浏览器页面右下角会显示运行过程
  // =========================================================
  var DEBUG =
    /(?:\?|&)debug=analytics(?:&|$)/.test(
      window.location.search
    );

  var debugBox = null;

  function debug(message) {
    if (!DEBUG) {
      return;
    }

    try {
      if (!debugBox) {
        debugBox =
          document.createElement("div");

        debugBox.style.cssText =
          "position:fixed;" +
          "left:8px;" +
          "right:8px;" +
          "bottom:8px;" +
          "z-index:2147483647;" +
          "max-height:45vh;" +
          "overflow:auto;" +
          "padding:10px;" +
          "background:rgba(0,0,0,.88);" +
          "color:#00ff80;" +
          "font:12px/1.6 monospace;" +
          "border-radius:8px;" +
          "word-break:break-all;";

        document.body.appendChild(
          debugBox
        );
      }

      var line =
        document.createElement("div");

      line.appendChild(
        document.createTextNode(
          new Date().toLocaleTimeString() +
          "  " +
          message
        )
      );

      debugBox.appendChild(
        line
      );

    } catch (e) {}
  }


  // =========================================================
  // UUID v4
  // =========================================================
  function createUuid() {
    try {
      if (
        window.crypto &&
        typeof window.crypto.randomUUID ===
          "function"
      ) {
        return window.crypto.randomUUID();
      }
    } catch (e) {}

    try {
      if (
        window.crypto &&
        typeof window.crypto.getRandomValues ===
          "function"
      ) {
        var bytes =
          new Uint8Array(16);

        window.crypto
          .getRandomValues(bytes);

        bytes[6] =
          (bytes[6] & 15) | 64;

        bytes[8] =
          (bytes[8] & 63) | 128;

        var hex = [];

        for (
          var i = 0;
          i < 256;
          i++
        ) {
          hex[i] =
            (i + 256)
              .toString(16)
              .slice(1);
        }

        return (
          hex[bytes[0]] +
          hex[bytes[1]] +
          hex[bytes[2]] +
          hex[bytes[3]] +
          "-" +
          hex[bytes[4]] +
          hex[bytes[5]] +
          "-" +
          hex[bytes[6]] +
          hex[bytes[7]] +
          "-" +
          hex[bytes[8]] +
          hex[bytes[9]] +
          "-" +
          hex[bytes[10]] +
          hex[bytes[11]] +
          hex[bytes[12]] +
          hex[bytes[13]] +
          hex[bytes[14]] +
          hex[bytes[15]]
        );
      }
    } catch (e) {}

    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx"
      .replace(
        /[xy]/g,
        function (c) {
          var r =
            Math.random() * 16 | 0;

          var v =
            c === "x"
              ? r
              : (r & 3) | 8;

          return v.toString(16);
        }
      );
  }


  // =========================================================
  // 安全 localStorage
  // =========================================================
  function storageGet(key) {
    try {
      return window.localStorage
        ? window.localStorage.getItem(key)
        : null;
    } catch (e) {
      debug(
        "localStorage读取失败: " +
        String(e)
      );

      return null;
    }
  }


  function storageSet(
    key,
    value
  ) {
    try {
      if (window.localStorage) {
        window.localStorage.setItem(
          key,
          value
        );
      }

      return true;

    } catch (e) {
      debug(
        "localStorage写入失败: " +
        String(e)
      );

      return false;
    }
  }


  // =========================================================
  // Visitor ID
  // =========================================================
  function getVisitorId() {
    var id =
      storageGet(
        VISITOR_KEY
      );

    if (!id) {
      id =
        createUuid();

      storageSet(
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
    var now =
      typeof Date.now === "function"
        ? Date.now()
        : new Date().getTime();

    var session =
      null;

    try {
      var raw =
        storageGet(
          SESSION_KEY
        );

      if (raw) {
        session =
          JSON.parse(raw);
      }
    } catch (e) {
      session =
        null;
    }

    if (
      !session ||
      !session.id ||
      !session.last_active ||
      now -
        Number(
          session.last_active
        ) >
        SESSION_TIMEOUT
    ) {
      session = {
        id:
          createUuid(),

        last_active:
          now
      };

    } else {
      session.last_active =
        now;
    }

    storageSet(
      SESSION_KEY,
      JSON.stringify(
        session
      )
    );

    return session.id;
  }


  // =========================================================
  // XMLHttpRequest
  //
  // 第一条访问统计优先使用非常成熟的 XHR。
  // =========================================================
  function postJson(
    data,
    onSuccess,
    onFailure
  ) {
    try {
      var xhr =
        new XMLHttpRequest();

      xhr.open(
        "POST",
        ENDPOINT,
        true
      );

      xhr.setRequestHeader(
        "Content-Type",
        "application/json"
      );

      xhr.timeout =
        12000;

      xhr.onreadystatechange =
        function () {
          if (
            xhr.readyState !== 4
          ) {
            return;
          }

          debug(
            "POST返回: HTTP " +
            xhr.status
          );

          if (
            xhr.status >= 200 &&
            xhr.status < 300
          ) {
            if (
              typeof onSuccess ===
              "function"
            ) {
              onSuccess(xhr);
            }
          } else {
            if (
              typeof onFailure ===
              "function"
            ) {
              onFailure(xhr);
            }
          }
        };

      xhr.onerror =
        function () {
          debug(
            "XHR网络错误"
          );

          if (
            typeof onFailure ===
            "function"
          ) {
            onFailure(xhr);
          }
        };

      xhr.ontimeout =
        function () {
          debug(
            "XHR请求超时"
          );

          if (
            typeof onFailure ===
            "function"
          ) {
            onFailure(xhr);
          }
        };

      debug(
        "开始POST " +
        ENDPOINT
      );

      xhr.send(
        JSON.stringify(
          data
        )
      );

      return true;

    } catch (e) {
      debug(
        "XHR异常: " +
        String(e)
      );

      if (
        typeof onFailure ===
        "function"
      ) {
        onFailure(null);
      }

      return false;
    }
  }


  // =========================================================
  // Beacon 备用
  // =========================================================
  function sendBeaconFallback(
    data
  ) {
    try {
      if (
        !navigator.sendBeacon ||
        typeof Blob ===
          "undefined"
      ) {
        debug(
          "sendBeacon不可用"
        );

        return false;
      }

      var blob =
        new Blob(
          [
            JSON.stringify(
              data
            )
          ],
          {
            type:
              "application/json"
          }
        );

      var result =
        navigator.sendBeacon(
          ENDPOINT,
          blob
        );

      debug(
        "sendBeacon: " +
        String(result)
      );

      return result;

    } catch (e) {
      debug(
        "sendBeacon异常: " +
        String(e)
      );

      return false;
    }
  }


  // =========================================================
  // 定位
  // =========================================================
  function requestLocation(
    visitorId,
    sessionId
  ) {
    if (
      !navigator.geolocation
    ) {
      debug(
        "浏览器不支持Geolocation"
      );

      return;
    }

    debug(
      "开始请求定位"
    );

    try {
      navigator.geolocation
        .getCurrentPosition(

          function (
            position
          ) {
            if (
              !position ||
              !position.coords
            ) {
              debug(
                "定位返回但coords为空"
              );

              return;
            }

            debug(
              "定位成功 accuracy=" +
              String(
                position.coords
                  .accuracy
              ) +
              "m"
            );

            var update = {
              visitor_id:
                visitorId,

              session_id:
                sessionId,

              location_update_only:
                true,

              location_status:
                "granted",

              gps_latitude:
                position.coords
                  .latitude,

              gps_longitude:
                position.coords
                  .longitude,

              gps_accuracy:
                position.coords
                  .accuracy
            };

            postJson(
              update,

              function () {
                debug(
                  "精确位置更新成功"
                );
              },

              function () {
                debug(
                  "精确位置更新失败"
                );
              }
            );
          },


          function (error) {
            var code =
              error
                ? error.code
                : "?";

            var message =
              error
                ? error.message
                : "";

            debug(
              "定位失败 code=" +
              code +
              " " +
              message
            );
          },


          {
            enableHighAccuracy:
              true,

            timeout:
              10000,

            maximumAge:
              0
          }
        );

    } catch (e) {
      debug(
        "调用定位API异常: " +
        String(e)
      );
    }
  }


  // =========================================================
  // 主程序
  // =========================================================
  function startAnalytics() {
    debug(
      "统计脚本已启动"
    );

    var visitorId;
    var sessionId;

    try {
      visitorId =
        getVisitorId();

      sessionId =
        getSessionId();

    } catch (e) {
      debug(
        "生成ID失败: " +
        String(e)
      );

      return;
    }

    debug(
      "visitor_id=" +
      visitorId
    );

    debug(
      "session_id=" +
      sessionId
    );


    // =======================================================
    // 第一条：
    // 页面打开立刻记录。
    // 完全不等待定位。
    // =======================================================
    var baseData = {
      visitor_id:
        visitorId,

      session_id:
        sessionId,

      path:
        window.location.pathname ||
        "/",

      title:
        document.title ||
        "",

      referrer:
        document.referrer ||
        "",

      language:
        navigator.language ||
        navigator.browserLanguage ||
        "",

      screen_width:
        window.screen
          ? window.screen.width
          : null,

      screen_height:
        window.screen
          ? window.screen.height
          : null,

      location_status:
        "pending",

      gps_latitude:
        null,

      gps_longitude:
        null,

      gps_accuracy:
        null
    };


    postJson(
      baseData,

      function () {
        baseRecorded =
          true;

        debug(
          "基础访问记录成功"
        );

        // 基础统计成功后
        // 才开始请求定位。
        requestLocation(
          visitorId,
          sessionId
        );
      },

      function () {
        debug(
          "基础XHR失败，尝试Beacon"
        );

        sendBeaconFallback(
          baseData
        );
      }
    );
  }


  // 页面即将退出时，
  // 如果基础记录还没有确认成功，
  // 再尝试一次 Beacon。
  function emergencyRecord() {
    if (baseRecorded) {
      return;
    }

    // 这里只做额外保险，
    // 不主动重新生成完整记录。
  }


  try {
    if (
      document.readyState ===
      "loading"
    ) {
      document.addEventListener(
        "DOMContentLoaded",
        startAnalytics,
        false
      );

    } else {
      startAnalytics();
    }

  } catch (e) {
    debug(
      "统计初始化异常: " +
      String(e)
    );
  }

})();
