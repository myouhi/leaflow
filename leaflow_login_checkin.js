/**
 * @name Leaflow 高级自动登录脚本
 * @description 自动抓取登录页面的表单链接和CSRF令牌，然后结合BoxJs数据完成登录。
 * @author Gemini
 * @version 20251008
 *
 * [task_local]
 * 0 7 * * * https://raw.githubusercontent.com/your-repo/leaflow_advanced_login.js, tag=Leaflow高级登录, enabled=true
 */

const $ = new Env('Leaflow高级登录');
const LOGIN_PAGE_URL = 'https://leaflow.net/login';

// --- 脚本主逻辑 ---
(async () => {
  const username = $prefs.get('@leaflow.username');
  const password = $prefs.get('@leaflow.password');

  if (!username || !password) {
    $.log('❌ 未在 BoxJs 中配置 Leaflow 账号密码，脚本终止。');
    return;
  }

  $.log(`🔔 开始为账号 [${username}] 执行高级登录流程...`);
  
  // 1. 获取登录页面的表单信息 (action URL 和 CSRF token)
  const loginInfo = await getLoginInfo();

  if (!loginInfo) {
    $.log('❌ 第一步失败：未能从登录页面获取必要信息。脚本终止。');
    return;
  }

  $.log(`✅ 第一步成功：获取到登录链接和令牌。`);
  $.log(`   - Login URL: ${loginInfo.actionUrl}`);
  $.log(`   - CSRF Token: ${loginInfo.csrfToken}`);
  
  // 2. 使用获取到的信息执行登录
  await performLogin(loginInfo, username, password);

})()
.catch((e) => $.logErr(e))
.finally(() => {
  $.log('- - - - - 本次任务执行完毕 - - - - -');
  $.done();
});

/**
 * 第一步：访问登录页，解析HTML，抓取表单的action链接和CSRF令牌
 */
function getLoginInfo() {
  return new Promise((resolve) => {
    const requestOptions = {
      url: LOGIN_PAGE_URL,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36'
      }
    };
    
    $.log('🚀 正在访问登录页面以获取表单信息...');
    $.get(requestOptions, (error, response, html) => {
      if (error || response.statusCode !== 200) {
        $.logErr(`访问登录页面失败: ${error || `Status Code ${response.statusCode}`}`);
        return resolve(null);
      }
      
      try {
        // --- ⚠️ 这是最关键、最需要你修改的部分 ---
        // 假设表单HTML是 <form action="/login/submit" method="post">
        const actionUrlMatch = html.match(/<form.*?action="([^"]+)"/);
        
        // 假设CSRF令牌的HTML是 <input type="hidden" name="_csrf" value="ABCDEFG12345">
        const csrfTokenMatch = html.match(/<input.*?name="_csrf".*?value="([^"]+)"/);
        // ---------------------------------------------

        if (actionUrlMatch && csrfTokenMatch) {
          // 如果抓到的action URL不是完整的链接 (例如 /login/submit)，则需要拼接
          let fullActionUrl = actionUrlMatch[1];
          if (fullActionUrl.startsWith('/')) {
            fullActionUrl = `https://leaflow.net${fullActionUrl}`;
          }

          const loginInfo = {
            actionUrl: fullActionUrl,
            csrfToken: csrfTokenMatch[1]
          };
          resolve(loginInfo);
        } else {
          $.logErr('解析HTML失败：未能匹配到表单链接或CSRF令牌。');
          $.log(`   - actionUrlMatch: ${actionUrlMatch}`);
          $.log(`   - csrfTokenMatch: ${csrfTokenMatch}`);
          resolve(null);
        }
      } catch (e) {
        $.logErr(`解析HTML时发生异常: ${e}`);
        resolve(null);
      }
    });
  });
}

/**
 * 第二步：使用抓取到的信息和账号密码，发送最终的登录请求
 */
function performLogin(loginInfo, username, password) {
  return new Promise((resolve) => {
    const { actionUrl, csrfToken } = loginInfo;
    
    const requestOptions = {
      url: actionUrl, // 使用动态抓取的URL
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded', // 登录表单通常是这种类型
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36',
        'Referer': LOGIN_PAGE_URL
      },
      // 请求体需要包含所有表单数据，包括抓到的CSRF令牌
      body: `_csrf=${csrfToken}&user=${username}&password=${password}` // ⚠️【请修改】这里的字段名 (user, password, _csrf) 必须和网页源码完全一致！
    };
    
    $.log('🚀 正在发送最终登录请求...');
    $.post(requestOptions, (error, response, data) => {
      // ...后续的登录成功/失败判断逻辑和之前一样...
      // 此处省略，你可以将上一版脚本的判断逻辑复制到这里
      // ...
       try {
        $.log(`statusCode: ${response.statusCode}`);
        const responseBody = JSON.parse(data);

        if (responseBody.code === 200 && responseBody.message === '登录成功') {
          $.log(`✅ 登录成功！用户名: ${username}`);
          const cookie = response.headers['Set-Cookie'] || response.headers['set-cookie'];
          if (cookie) {
            $prefs.set(cookie, '@leaflow.cookie');
            $.log(`🍪 Cookie 已成功保存。`);
          } else {
            $.log('⚠️ 登录成功，但未能获取到 Cookie。');
          }
        } else {
          const reason = responseBody.message || '未知原因';
          $.log(`❌ 登录失败: ${reason}`);
        }
      } catch (e) {
        $.logErr(`解析响应失败: ${e}`);
      } finally {
        resolve();
      }
    });
  });
}

// 通用 Env 环境，兼容 Surge, Quantumult X, Loon
function Env(name, opts) { /* ... 此处省略通用 Env 代码 ... */ }
