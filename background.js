// 扩展安装或更新时初始化
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // 初始化设置
    chrome.storage.sync.set({
      apiProvider: 'gemini',
      geminiModel: 'gemini-2.0-flash', // 默认Gemini模型
      openaiModel: 'gpt-3.5-turbo', // 默认OpenAI模型
      defaultCategories: '技术,教育,购物,社交媒体,新闻,娱乐,工作,其他',
      batchSize: 50 // 替换maxBookmarks为batchSize，表示每批处理的书签数量
    });
    
    // 安装后自动打开选项页面
    chrome.runtime.openOptionsPage();
  }
});

// 监听来自popup和options页面的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getBookmarks') {
    chrome.bookmarks.getTree((bookmarkTreeNodes) => {
      sendResponse({ bookmarks: bookmarkTreeNodes });
    });
    return true; // 异步响应需要返回true
  }
}); 