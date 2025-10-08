/*
 * Surge Script: Leaflow Auto Login
 *
 * 作用:
 * 1. 模拟 POST 请求登录 leaflow.net。
 * 2. 从响应头中获取 Cookie。
 * 3. 将 Cookie 保存到 $persistentStore，供其他脚本使用。
 *
 * 如何使用:
 * 1. 在 Surge 配置文件的 [Script] 段中添加:
 * Leaflow-Login = type=generic, script-path=leaflow-login.js
 * 2. 在 Surge 脚本编辑器中选择此脚本并手动执行。
 * 3. 成功后会弹出通知。
 *
 * 定时执行 (可选):
 * 1. 在 [Script] 段中添加:
 * Leaflow-Login-Cron = type=cron, cronexp="0 8 * * *", script-path=leaflow-login.js, wakeup=true
 * (上述 cronexp 表示每天早上 8 点执行一次)
 */

async function autoLogin() {
    // --- 请根据你抓取到的信息修改以下变量 ---
    const email = "你的邮箱地址"; // 替换为你的登录邮箱
    const password = "你的登录密码"; // 替换为你的登录密码
    
    // 登录请求的 URL 和表单数据
    const loginUrl = "https://leaflow.net/login";
    const body = `email=${encodeURIComponent(email)}&passwd=${encodeURIComponent(password)}&remember_me=on`;
    // 注意: 上面的 'email' 和 'passwd' 是常见的字段名，请务必替换成你通过开发者工具抓取到的真实字段名。
    // --- 修改结束 ---

    const request = {
        url: loginUrl,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
            'Referer': 'https://leaflow.net/login'
        },
        body: body
    };

    $httpClient.post(request, (error, response, data) => {
        if (error) {
            console.error(`登录失败: ${error}`);
            $notification.post("Leaflow 登录失败", "网络请求错误", error);
            $done();
            return;
        }

        if (response.statusCode === 200 || response.statusCode === 302) {
            // 登录成功后通常会有一个重定向 (302) 或返回成功页面 (200)
            const cookie = response.headers['Set-Cookie'] || response.headers['set-cookie'];
            if (cookie) {
                const success = $persistentStore.write(cookie, 'LeaflowCookieKey');
                if (success) {
                    console.log("Cookie 保存成功");
                    $notification.post("Leaflow 登录成功", "Cookie 已成功获取并保存", "");
                } else {
                    console.error("Cookie 保存失败");
                    $notification.post("Leaflow 登录失败", "未能写入持久化存储", "");
                }
            } else {
                console.error("登录似乎成功，但未找到 Set-Cookie");
                $notification.post("Leaflow 登录失败", "未能从响应中获取 Cookie", "请检查账号密码是否正确，或网站逻辑是否变更。");
            }
        } else {
            console.error(`登录失败，服务器响应码: ${response.statusCode}`);
            $notification.post("Leaflow 登录失败", `服务器返回状态码: ${response.statusCode}`, "请检查脚本或网络连接。");
        }
        $done();
    });
}

autoLogin();
