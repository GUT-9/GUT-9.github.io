const WORKER_URL =
  "https://gut9-analytics.futianji0702.workers.dev/collect";

const RELAY_SECRET =
  "P3eGHzmOOL0chgFGFpFB-HJU5iRcuO0w9mAB-9Vqw_A";

export default async (request) => {
  if (request.method !== "POST") {
    return jsonResponse(
      {
        ok: false,
        message: "Method Not Allowed"
      },
      405,
      {
        "Allow": "POST"
      }
    );
  }

  // ===========================================================
  // 验证 EdgeOne -> Netlify 中继密钥
  // ===========================================================
  const suppliedSecret =
    request.headers.get(
      "x-gut9-relay-secret"
    ) || "";

  if (suppliedSecret !== RELAY_SECRET) {
    return jsonResponse(
      {
        ok: false,
        message: "Unauthorized"
      },
      401
    );
  }

  try {
    // ===========================================================
    // 读取请求体
    // ===========================================================
    const body =
      await request.text();

    if (body.length > 64 * 1024) {
      return jsonResponse(
        {
          ok: false,
          message: "Payload too large"
        },
        413
      );
    }

    // ===========================================================
    // 接收 EdgeOne 传来的真实访客信息
    // ===========================================================
    const clientIp =
      request.headers.get(
        "x-gut9-client-ip"
      ) || "";

    const country =
      request.headers.get(
        "x-gut9-country"
      ) || "";

    const region =
      request.headers.get(
        "x-gut9-region"
      ) || "";

    const city =
      request.headers.get(
        "x-gut9-city"
      ) || "";

    const userAgent =
      request.headers.get(
        "x-gut9-user-agent"
      ) || "";

    const referer =
      request.headers.get(
        "x-gut9-referer"
      ) || "";

    // ===========================================================
    // 构造发送给 Cloudflare Worker 的 Header
    // ===========================================================
    const headers =
      new Headers();

    headers.set(
      "Content-Type",
      "application/json"
    );

    headers.set(
      "X-GUT9-Relay-Secret",
      RELAY_SECRET
    );

    headers.set(
      "X-GUT9-Relay",
      "Netlify"
    );

    // 真实访客 IP
    headers.set(
      "X-GUT9-Client-IP",
      clientIp
    );

    // 真实访客位置
    headers.set(
      "X-GUT9-Country",
      country
    );

    headers.set(
      "X-GUT9-Region",
      region
    );

    headers.set(
      "X-GUT9-City",
      city
    );

    // 浏览器信息
    if (userAgent) {
      headers.set(
        "X-GUT9-User-Agent",
        userAgent
      );
    }

    if (referer) {
      headers.set(
        "X-GUT9-Referer",
        referer
      );
    }

    // ===========================================================
    // 转发到 Cloudflare Worker
    // ===========================================================
    const upstream =
      await fetch(
        WORKER_URL,
        {
          method: "POST",
          headers: headers,
          body: body,
          redirect: "manual"
        }
      );

    const upstreamBody =
      await upstream.text();

    // ===========================================================
    // 把 Cloudflare Worker 响应返回给 EdgeOne
    // ===========================================================
    return new Response(
      upstreamBody,
      {
        status: upstream.status,

        headers: {
          "Content-Type":
            upstream.headers.get(
              "content-type"
            ) ||
            "application/json; charset=utf-8",

          "Cache-Control":
            "no-store, no-cache, must-revalidate",

          "X-GUT9-Relay":
            "Netlify"
        }
      }
    );

  } catch (error) {
    return jsonResponse(
      {
        ok: false,
        message:
          "Upstream Worker request failed",
        error: String(error)
      },
      502
    );
  }
};


// =============================================================
// JSON Response
// =============================================================
function jsonResponse(
  data,
  status,
  extraHeaders = {}
) {
  return new Response(
    JSON.stringify(data),
    {
      status: status,

      headers: {
        "Content-Type":
          "application/json; charset=utf-8",

        "Cache-Control":
          "no-store, no-cache, must-revalidate",

        ...extraHeaders
      }
    }
  );
}
