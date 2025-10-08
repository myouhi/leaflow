/*
 * Surge Script: Leaflow Cookie Injector
 *
 * 作用:
 * 在访问 leaflow.net 时，自动将已保存的 Cookie 注入到请求头中。
 *
 * 如何使用:
 * 1. 确保 leaflow.net 在你的 MITM 主机名列表中。
 * [MITM]
 * hostname = %APPEND% leaflow.net
 * 2. 在 Surge 配置文件的 [Script] 段中添加:
 * Leaflow-Cookie = type=http-request, pattern=^https:\/\/leaflow\.net, script-path=https://raw.githubusercontent.com/myouhi/leaflow/master/leaflow-cookie-injector.js, requires-body=false
 */

function injectCookie() {
    const storedCookie = $persistentStore.read('LeaflowCookieKey');

    if (storedCookie && $request.headers['Cookie'] !== storedCookie) {
        let newHeaders = $request.headers;
        newHeaders['Cookie'] = storedCookie;
        console.log("成功注入 Leaflow Cookie。");
        $done({ headers: newHeaders });
    } else {
        $done({});
    }
}

injectCookie();
