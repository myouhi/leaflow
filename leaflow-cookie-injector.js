/*
 * Surge Script: Leaflow Cookie Injector (V2 - Smart Notification)
 */

function injectCookie() {
    // --- 配置 ---
    const notifyIntervalMinutes = 30; // 设置通知间隔时间（分钟），30分钟提醒一次
    // --- 配置结束 ---

    const cookieKey = 'LeaflowCookieKey';
    const lastNotifyTimeKey = 'LeaflowLastNotifyTime';

    const storedCookie = $persistentStore.read(cookieKey);

    if (storedCookie && $request.headers['Cookie'] !== storedCookie) {
        let newHeaders = $request.headers;
        newHeaders['Cookie'] = storedCookie;
        
        // --- 智能通知逻辑 ---
        const lastNotifyTime = $persistentStore.read(lastNotifyTimeKey);
        const currentTime = new Date().getTime();
        const intervalMilliseconds = notifyIntervalMinutes * 60 * 1000;

        // 如果没有上次通知时间，或者距离上次通知已超过设定的间隔
        if (!lastNotifyTime || (currentTime - lastNotifyTime > intervalMilliseconds)) {
            $notification.post(
                "Leaflow Cookie 已注入",
                `自动登录已生效 (每${notifyIntervalMinutes}分钟提醒一次)`,
                `请求地址: ${$request.url}`
            );
            // 记录本次通知的时间
            $persistentStore.write(String(currentTime), lastNotifyTimeKey);
            console.log("成功注入 Leaflow Cookie 并已发送通知。");
        } else {
            console.log("成功注入 Leaflow Cookie (静默模式)。");
        }
        
        $done({ headers: newHeaders });
    } else {
        $done({});
    }
}

injectCookie();
