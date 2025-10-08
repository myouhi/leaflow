/**
 * @name Leaflow 登录脚本
 * @description 用于自动登录 Leaflow 并获取 Cookie。
 * @author Gemini
 * @version 20251008
 *
 * [task_local]
 * # 每天早上 7 点执行一次登录任务
 * 0 7 * * * https://raw.githubusercontent.com/your-repo/leaflow_login.js, tag=Leaflow登录, enabled=true
 */

const $ = new Env('Leaflow');

// --- 脚本主要逻辑 ---
(async () => {
  // 1. 从 BoxJs 读取账号信息
  const username = $prefs.get('@leaflow.username');
  const password = $prefs.get('@leaflow.password');

  if (!username || !password) {
    $.log('❌ 未在 BoxJs 中配置 Leaflow 的账号或密码');
    $.msg('Leaflow 登录失败', '配置错误', '请先在 BoxJs 中设置账号和密码');
    return;
  }
  
  $.log(`🔔 开始为账号 [${username}] 执行登录...`);

  // 2. 发送登录请求
  await login(username, password);

})()
.catch((e) => {
  $.logErr(e);
})
.finally(() => {
  $.done();
});


// --- 登录函数 ---
function login(username, password) {
  return new Promise((resolve) => {
    // --- ⚠️ 这是你需要根据抓包结果修改的核心部分 ---
    const requestOptions = {
      // 登录接口的 URL，需要你通过抓包获取
      url: 'https://leaflow.net/login/api', // <--- ⚠️ 【请修改】这里很可能不是这个地址

      // 请求方法，通常是 POST
      method: 'POST',

      // 请求头，非常重要，需要从抓包结果中复制
      headers: {
        'Content-Type': 'application/json;charset=UTF-8', // <--- ⚠️ 【请修改】可能是 application/x-www-form-urlencoded
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36',
        'Referer': 'https://leaflow.net/login', // 通常需要 Referer
        'X-Requested-With': 'XMLHttpRequest' // 异步请求的标志
        // 如果有其他类似 x-csrf-token 的头，也需要加上
      },

      // 请求体，包含了你的账号和密码
      body: JSON.stringify({ // <--- ⚠️ 【请修改】如果 Content-Type 是 form-urlencoded，格式需要改变
        'user': username, // <--- ⚠️ 【请修改】这里的 key (例如 'user') 需要根据抓包结果确定
        'password': password, // <--- ⚠️ 【请修改】这里的 key (例如 'password') 需要根据抓包结果确定
        'remember_me': 'on'
      })
    };
    // ----------------------------------------------------

    $.log('🚀 正在发送登录请求...');
    $.post(requestOptions, (error, response, data) => {
      if (error) {
        $.logErr(`登录请求失败: ${error}`);
        $.msg('Leaflow 登录失败', '网络错误', '请检查网络连接或代理设置');
        return;
      }

      try {
        $.log(`statusCode: ${response.statusCode}`);
        $.log(`response headers: ${JSON.stringify(response.headers)}`);
        $.log(`response body: ${data}`);

        // 3. 判断登录是否成功
        const responseBody = JSON.parse(data); // 假设返回的是 JSON
        // --- ⚠️ 【请修改】这里的判断条件需要根据实际返回的数据来写 ---
        if (responseBody.code === 200 && responseBody.message === '登录成功') {
          $.log('✅ 登录成功！');

          // 4. 提取并保存 Cookie
          const cookie = response.headers['Set-Cookie'] || response.headers['set-cookie'];
          if (cookie) {
            $prefs.set(cookie, '@leaflow.cookie');
            $.log(`🍪 Cookie 已保存: ${cookie}`);
            $.msg('Leaflow 登录成功', `账号: ${username}`, 'Cookie 已获取并保存');
          } else {
            $.msg('Leaflow 登录成功', '但未能获取 Cookie', '请检查脚本的 Cookie 提取逻辑');
          }

        } else {
          // 登录失败
          const reason = responseBody.message || '未知原因';
          $.log(`❌ 登录失败: ${reason}`);
          $.msg('Leaflow 登录失败', `原因: ${reason}`, `账号: ${username}`);
        }
      } catch (e) {
        $.logErr(`解析响应失败: ${e}`);
        $.msg('Leaflow 登录失败', '脚本错误', '无法解析服务器返回的数据');
      } finally {
        resolve();
      }
    });
  });
}

// 通用 Env 环境，兼容 Surge, Quantumult X, Loon
function Env(name, opts) { /* ... 此处省略通用 Env 代码 ... */ }
// 由于 Env 代码很长，我将它省略了。你可以从任何标准 Quantumult X 脚本中复制完整的 Env 构造函数。
// 如果你需要完整的代码，我可以单独提供。
