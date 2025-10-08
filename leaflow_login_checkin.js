// --- 登录函数 (控制台显示用户名版) ---
function login(username, password) {
  return new Promise((resolve) => {
    // --- ⚠️ 核心配置部分，仍然需要你根据抓包结果填写 ---
    const requestOptions = {
      url: 'https://leaflow.net/login/api', // <--- 【请修改】
      method: 'POST',
      headers: {
        'Content-Type': 'application/json;charset=UTF-8', // <--- 【请修改】
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36',
        'Referer': 'https://leaflow.net/login'
      },
      body: JSON.stringify({
        'user': username,     // <--- 【请修改】
        'password': password  // <--- 【请修改】
      })
    };
    // ----------------------------------------------------

    $.log('🚀 正在发送登录请求...');
    $.post(requestOptions, (error, response, data) => {
      if (error) {
        $.logErr(`登录请求失败: ${error}`);
        return;
      }

      try {
        $.log(`statusCode: ${response.statusCode}`);
        const responseBody = JSON.parse(data);

        // --- ⚠️ 【请修改】这里的判断条件需要根据实际返回的数据来写 ---
        if (responseBody.code === 200 && responseBody.message === '登录成功') {
          // ✨ 修改后的日志，明确显示登录成功和用户名
          $.log(`✅ 登录成功！用户名: ${username}`);

          const cookie = response.headers['Set-Cookie'] || response.headers['set-cookie'];
          if (cookie) {
            $prefs.set(cookie, '@leaflow.cookie');
            $.log(`🍪 Cookie 已成功保存。`);
          } else {
            $.log('⚠️ 登录成功，但未能获取到 Cookie，请检查脚本。');
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
