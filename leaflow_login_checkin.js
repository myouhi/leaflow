/*
 * Surge 脚本：Leaflow 自动登录并签到 (BoxJS 版)
 *
 * [说明]
 * 此脚本会从 BoxJS 读取用户名和密码，更加安全和方便。
 *
 * [首次配置]
 * 1. 确保已安装并配置好 BoxJS。
 * 2. 订阅对应的 BoxJS 应用，并在其中填写您的用户名和密码。
 * - 用户名 Key: leaf_username
 * - 密码 Key:   leaf_password
 */

// --- 用户需要配置的部分 ---
const loginUrl = 'https://leaflow.com/api/login';      // <--- 请替换成实际的登录请求 URL
const checkinUrl = 'https://leaflow.com/api/check-in';    // <--- 请替换成实际的签到请求 URL

// --- BoxJS 数据键 (必须与 BoxJS 订阅中的 id 一致) ---
const KEY_USERNAME = 'leaf_username';
const KEY_PASSWORD = 'leaf_password';

// --- 主要逻辑 ---
(async () => {
    // 从 BoxJS ($persistentStore) 读取用户名和密码
    const username = $persistentStore.read(KEY_USERNAME);
    const password = $persistentStore.read(KEY_PASSWORD);

    if (!username || !password) {
        const msg = `请先在 BoxJS 中为 ${KEY_USERNAME} 和 ${KEY_PASSWORD} 设置正确的凭证。`;
        console.log(`❌ ${msg}`);
        $notification.post('Leaflow 签到配置错误', '', msg);
        $done();
        return;
    }

    console.log(`[${new Date().toLocaleString()}] 开始执行 Leaflow 登录...`);
    getCookie(username, password, (cookie) => {
        if (!cookie) {
            console.log('❌ 登录失败或未能获取 Cookie');
            $done();
            return;
        }
        console.log('✅ 登录成功, Cookie 获取成功!');
        checkIn(cookie);
    });
})();


// --- 网络请求函数 (与上一版相同，无需修改) ---

/**
 * 登录并获取 Cookie
 * @param {string} username 用户名
 * @param {string} password 密码
 * @param {function(string|null)} callback 回调函数
 */
function getCookie(username, password, callback) {
    const request = {
        url: loginUrl,
        headers: {
            'Content-Type': 'application/json;charset=UTF-8',
            'User-Agent': 'Surge/5 CFNetwork/1408.0.4 Darwin/22.5.0'
        },
        body: JSON.stringify({
            'email': username,
            'passwd': password 
        })
    };

    $httpClient.post(request, (error, response, data) => {
        if (error) {
            $notification.post('Leaflow 登录失败', '网络请求错误', error);
            callback(null);
        } else if (response.statusCode !== 200) {
            $notification.post('Leaflow 登录失败', `服务器错误: ${response.statusCode}`, '请检查登录 URL 和提交的参数');
            callback(null);
        } else {
            const cookie = response.headers['Set-Cookie'] || response.headers['set-cookie'];
            if (!cookie) {
                $notification.post('Leaflow 登录失败', '未能获取 Cookie', '可能是用户名或密码错误');
                callback(null);
            } else {
                callback(cookie);
            }
        }
    });
}

/**
 * 执行签到
 * @param {string} cookie
 */
function checkIn(cookie) {
    const request = {
        url: checkinUrl,
        method: 'POST',
        headers: { 'Cookie': cookie, 'User-Agent': 'Surge/5 CFNetwork/1408.0.4 Darwin/22.5.0' }
    };

    $httpClient.post(request, (error, response, data) => {
        if (error) {
            $notification.post('Leaflow 签到失败', '网络请求错误', error);
        } else {
            try {
                const result = JSON.parse(data);
                if (result.ret === 1 || (result.msg && (result.msg.includes('成功') || result.msg.includes('已经签到')))) {
                    $notification.post('Leaflow 签到成功', '', result.msg || '任务已完成');
                } else {
                    $notification.post('Leaflow 签到失败', '', result.msg || '未知错误');
                }
            } catch (e) {
                $notification.post('Leaflow 签到失败', '无法解析服务器响应', data);
            }
        }
        $done();
    });
}
