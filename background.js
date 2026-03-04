// background.js
let isImporting = false;

// 扩展安装或更新时初始化
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // 初始化设置
    chrome.storage.sync.set({
      apiProvider: 'gemini',
      geminiModel: 'gemini-2.0-flash', // 默认Gemini模型
      openaiModel: 'gpt-3.5-turbo', // 默认OpenAI模型
      defaultCategories: '技术,教育,购物,社交媒体,新闻,娱乐,工作,其他',
      batchSize: 50, // 替换maxBookmarks为batchSize，表示每批处理的书签数量
      autoCategorize: false // 默认关闭新书签自动分类
    });

    // 安装后自动打开选项页面
    chrome.runtime.openOptionsPage();
  }
});

// 测试监听器：如果背景脚本存活，它应该能捕获设置改变
chrome.storage.onChanged.addListener((changes, area) => {
  console.log('[Auto-Categorize] 监听到存储改变:', changes);

  if (changes.autoCategorize) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
      title: '书签助手：设置改变 (Debug)',
      message: `自动分类已变为: ${changes.autoCategorize.newValue}`
    });
  }
});

// 监听书签导入状态（防止导入时触发大量分类请求）
chrome.bookmarks.onImportBegan.addListener(() => { isImporting = true; });
chrome.bookmarks.onImportEnded.addListener(() => { isImporting = false; });

// 监听新书签创建，自动分类
chrome.bookmarks.onCreated.addListener((id, bookmark) => {
  // 必须使用同步的 listener，内部再调用 async，否则 Chrome V3 可能会吞掉事件
  (async () => {
    console.log('[Auto-Categorize] 书签创建事件触发:', bookmark);
    appendLog(`[EVENT] 书签已创建: ${bookmark.title || bookmark.url}`);

    // 仅处理真实的 URL 书签，忽略文件夹和导入中的书签
    if (!bookmark.url || isImporting) {
      console.log('[Auto-Categorize] 忽略：文件夹或正在导入中');
      appendLog('忽略：该项目是文件夹或系统正在导入书签');
      return;
    }

    // 获取设置
    const settings = await chrome.storage.sync.get([
      'autoCategorize', 'apiProvider', 'apiKey',
      'geminiModel', 'openaiModel', 'customApiUrl', 'customModel',
      'defaultCategories', 'customCategories'
    ]);

    // 如果未开启自动分类或未配置 API 密钥，则略过
    if (!settings.autoCategorize) {
      console.log('[Auto-Categorize] 未开启自动分类');
      appendLog('未开启自动分类，略过');
      return;
    }

    if (!settings.apiKey) {
      console.log('[Auto-Categorize] 未配置 API 密钥');
      return;
    }

    console.log('[Auto-Categorize] 开始分类过程，触发通知');
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
      title: '书签助手：开始分类 (Debug)',
      message: `准备尝试分类: "${bookmark.title || bookmark.url}"`
    });

    try {
      const categoryName = await categorizeSingleBookmark(bookmark, settings);
      console.log('[Auto-Categorize] 返回类别:', categoryName);

      if (!categoryName) {
        console.log('[Auto-Categorize] 分类名称无效或为空');
        return;
      }

      // 获取目标文件夹（目前默认在当前 parentId 下查找/创建分类文件夹，通常为书签栏 "1"）
      const targetFolderId = await getOrCreateCategoryFolder(categoryName, bookmark.parentId);
      console.log('[Auto-Categorize] 目标文件夹 ID:', targetFolderId);

      // 如果分类文件夹就是当前文件夹，无需移动
      if (targetFolderId === bookmark.parentId) {
        console.log('[Auto-Categorize] 已经在目标文件夹，无需移动');
        return;
      }

      // 移动书签到分类文件夹
      await chrome.bookmarks.move(bookmark.id, { parentId: targetFolderId });

      console.log(`[Auto-Categorize] 书签 "${bookmark.title}" 已分类至 "${categoryName}"`);

      // 发送系统通知告知用户
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
        title: '书签助手：自动分类成功 🪄',
        message: `已将新书签 "${bookmark.title || bookmark.url}" 归类为 [${categoryName}]`
      });

    } catch (error) {
      console.error('[Auto-Categorize] 自动分类时出错:', error);
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
        title: '书签助手：自动分类错误',
        message: `错误: ${error.message}`
      });
    }
  })();
});

/**
 * 查找或创建分类文件夹
 */
async function getOrCreateCategoryFolder(categoryName, defaultParentId = '1') {
  return new Promise((resolve) => {
    chrome.bookmarks.getChildren(defaultParentId, (children) => {
      const folder = children.find(c => c.title === categoryName && !c.url);
      if (folder) {
        resolve(folder.id);
      } else {
        chrome.bookmarks.create({ parentId: defaultParentId, title: categoryName }, (newFolder) => {
          resolve(newFolder.id);
        });
      }
    });
  });
}

/**
 * 请求 AI 对单个书签分类
 */
async function categorizeSingleBookmark(bookmark, settings) {
  const prompt = `请将以下书签分配到最合适的分类中。如果在以下预设分类中找不到合适的，可创建一个简短的新分类名（中文字符，不要太长）。
预设分类：${settings.defaultCategories || '技术,设计,娱乐,购物,工具'}
如果有自定义分类：${JSON.stringify(settings.customCategories || {})}

书签标题：${bookmark.title}
书签URL：${bookmark.url}

要求：直接返回分类名称，仅返回一个词或短语，不要输出多余解释、标点或JSON。`;

  if (settings.apiProvider === 'gemini') {
    return await callGeminiApi(prompt, settings.apiKey, settings.geminiModel || 'gemini-1.5-pro');
  } else if (settings.apiProvider === 'openai') {
    return await callOpenAiApi(prompt, settings.apiKey, settings.openaiModel || 'gpt-3.5-turbo');
  } else if (settings.apiProvider === 'custom') {
    return await callCustomApi(prompt, settings.apiKey, settings.customApiUrl, settings.customModel || '');
  }
  return null;
}

async function callGeminiApi(prompt, apiKey, model) {
  const apiVersion = model.startsWith('gemini-1.5') ? 'v1' : 'v1beta';
  const url = `https://generativelanguage.googleapis.com/${apiVersion}/models/${model}:generateContent?key=${apiKey}`;

  const requestData = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.2, maxOutputTokens: 20 }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestData)
  });

  const responseText = await response.text();
  if (!response.ok) {
    throw new Error(`Gemini API HTTP异常 ${response.status}: ${responseText.substring(0, 100)}`);
  }

  let data;
  try {
    data = JSON.parse(responseText);
  } catch (err) {
    throw new Error(`Gemini 返回了非JSON格式数据 (可能受到网关或代理拦截)。响应开头: ${responseText.substring(0, 50)}`);
  }

  const result = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return cleanCategoryName(result);
}

async function callOpenAiApi(prompt, apiKey, model) {
  const url = 'https://api.openai.com/v1/chat/completions';
  const requestData = {
    model: model,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 20,
    temperature: 0.2
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(requestData)
  });

  const responseText = await response.text();
  if (!response.ok) {
    throw new Error(`OpenAI API HTTP异常 ${response.status}: ${responseText.substring(0, 100)}`);
  }

  let data;
  try {
    data = JSON.parse(responseText);
  } catch (err) {
    throw new Error(`OpenAI 返回了非JSON格式数据 (可能受到网关或代理拦截)。响应开头: ${responseText.substring(0, 50)}`);
  }

  const result = data.choices?.[0]?.message?.content || '';
  return cleanCategoryName(result);
}

async function callCustomApi(prompt, apiKey, customApiUrl, model) {
  if (!customApiUrl) throw new Error('未设置代理/自定义 API URL');
  const requestData = {
    model: model,
    messages: [{ role: "user", content: prompt }],
    max_tokens: 20,
    temperature: 0.2
  };

  const headers = {
    'Content-Type': 'application/json'
  };
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  const response = await fetch(customApiUrl, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(requestData)
  });

  const responseText = await response.text();
  if (!response.ok) {
    throw new Error(`自定义 API HTTP异常 ${response.status}: ${responseText.substring(0, 100)}`);
  }

  let data;
  try {
    data = JSON.parse(responseText);
  } catch (err) {
    throw new Error(`API 地址 [${customApiUrl}] 返回了非JSON格式数据 (可能是不支持的模型端点，也可能是代理返回了网页)。响应开头: ${responseText.substring(0, 50)}`);
  }

  // 按照 OpenAI 兼容格式解析
  let result = '';
  if (data.choices && data.choices[0] && data.choices[0].message) {
    result = data.choices[0].message.content;
  }
  return cleanCategoryName(result);
}

function cleanCategoryName(name) {
  if (!name) return null;
  // 移除首尾空白、换行、标点符号、引号、Markdown代码块格式等
  let cleaned = name.trim().replace(/^['"\s`]+|['"\s`]+$/g, '');
  cleaned = cleaned.replace(/[.,;。，、！!？?]/g, '');

  if (cleaned.length > 20) {
    if (cleaned.includes('：')) cleaned = cleaned.split('：').pop().trim();
    if (cleaned.includes(':')) cleaned = cleaned.split(':').pop().trim();
  }
  return cleaned && cleaned.length <= 20 ? cleaned : null;
}

// 监听来自popup和options页面的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getBookmarks') {
    chrome.bookmarks.getTree((bookmarkTreeNodes) => {
      sendResponse({ bookmarks: bookmarkTreeNodes });
    });
    return true; // 异步响应需要返回true
  }
}); 