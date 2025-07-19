// 默认提示词模板
const DEFAULT_PROMPT_TEMPLATE = `请分析以下书签，将它们分类到合适的类别中。每个书签包含标题和URL。

请按照以下JSON格式返回分类结果：
{
  "分类名称1": [
    {"title": "书签标题1", "url": "书签URL1"},
    {"title": "书签标题2", "url": "书签URL2"}
  ],
  "分类名称2": [
    {"title": "书签标题3", "url": "书签URL3"}
  ]
}

分类原则：
1. 根据书签的内容、主题或用途进行分类
2. 分类名称要简洁明了，使用中文
3. 相似的书签应该归类到同一分类
4. 如果某个书签不适合任何现有分类，可以创建新分类
5. 确保返回的是有效的JSON格式

书签列表：
`;

// 初始化选项页面
document.addEventListener('DOMContentLoaded', () => {
  // 加载保存的设置
  loadSettings();
  
  // 添加事件监听
  document.getElementById('api-provider').addEventListener('change', toggleProviderFields);
  document.getElementById('save-settings').addEventListener('click', saveApiSettings);
  document.getElementById('test-api').addEventListener('click', testApiConnection);
  document.getElementById('save-category-settings').addEventListener('click', saveCategorySettings);
  document.getElementById('toggle-debug').addEventListener('click', toggleDebugPanel);
});

// 切换调试面板显示/隐藏
function toggleDebugPanel() {
  const debugPanel = document.getElementById('debug-panel');
  const toggleButton = document.getElementById('toggle-debug');
  
  if (debugPanel.style.display === 'block') {
    debugPanel.style.display = 'none';
    toggleButton.textContent = '显示调试信息';
  } else {
    debugPanel.style.display = 'block';
    toggleButton.textContent = '隐藏调试信息';
  }
}

// 更新调试面板信息
function updateDebugInfo(url = '', request = '', response = '', error = '') {
  document.getElementById('debug-url').textContent = url;
  document.getElementById('debug-request').textContent = typeof request === 'object' ? JSON.stringify(request, null, 2) : request;
  document.getElementById('debug-response').textContent = typeof response === 'object' ? JSON.stringify(response, null, 2) : response;
  document.getElementById('debug-error').textContent = error;
  
  // 自动显示调试面板
  document.getElementById('debug-panel').style.display = 'block';
  document.getElementById('toggle-debug').textContent = '隐藏调试信息';
}

// 加载保存的设置
function loadSettings() {
  chrome.storage.sync.get([
    'apiProvider', 
    'apiKey', 
    'customApiUrl',
    'geminiModel',
    'openaiModel',
    'customModel',
    'defaultCategories',
    'batchSize'
  ], (result) => {
    // API设置
    if (result.apiProvider) {
      document.getElementById('api-provider').value = result.apiProvider;
      toggleProviderFields();
    }
    
    if (result.apiKey) {
      document.getElementById('api-key').value = result.apiKey;
    }
    
    if (result.customApiUrl) {
      document.getElementById('custom-api-url').value = result.customApiUrl;
    }
    
    // 模型设置
    if (result.geminiModel) {
      document.getElementById('gemini-model').value = result.geminiModel;
    }
    
    if (result.openaiModel) {
      document.getElementById('openai-model').value = result.openaiModel;
    }
    
    if (result.customModel) {
      document.getElementById('custom-model').value = result.customModel;
    }
    
    // 分类设置
    if (result.defaultCategories) {
      document.getElementById('default-categories').value = result.defaultCategories;
    }
    
    if (result.batchSize) {
      document.getElementById('batch-size').value = result.batchSize;
    } else {
      document.getElementById('batch-size').value = '50';
    }
  });
}

// 切换显示/隐藏API提供商相关字段
function toggleProviderFields() {
  const apiProvider = document.getElementById('api-provider').value;
  const customApiFields = document.getElementById('custom-api-fields');
  const geminiApiInfo = document.getElementById('api-gemini-info');
  const openaiApiInfo = document.getElementById('api-openai-info');
  const geminiModelField = document.getElementById('gemini-model-field');
  const openaiModelField = document.getElementById('openai-model-field');
  const customModelField = document.getElementById('custom-model-field');
  
  // 隐藏所有API相关信息和模型选择器
  geminiApiInfo.classList.add('hidden');
  openaiApiInfo.classList.add('hidden');
  geminiModelField.classList.add('hidden');
  openaiModelField.classList.add('hidden');
  customModelField.classList.add('hidden');
  customApiFields.classList.add('hidden');
  
  // 根据所选提供商显示对应的字段
  switch (apiProvider) {
    case 'gemini':
      geminiApiInfo.classList.remove('hidden');
      geminiModelField.classList.remove('hidden');
      break;
    case 'openai':
      openaiApiInfo.classList.remove('hidden');
      openaiModelField.classList.remove('hidden');
      break;
    case 'custom':
      customApiFields.classList.remove('hidden');
      customModelField.classList.remove('hidden');
      break;
  }
}

// 保存API设置
function saveApiSettings() {
  const apiProvider = document.getElementById('api-provider').value;
  const apiKey = document.getElementById('api-key').value;
  let customApiUrl = '';
  let modelValue = '';
  
  // 根据API提供商获取对应的模型值
  switch (apiProvider) {
    case 'gemini':
      modelValue = document.getElementById('gemini-model').value;
      break;
    case 'openai':
      modelValue = document.getElementById('openai-model').value;
      break;
    case 'custom':
      modelValue = document.getElementById('custom-model').value;
      customApiUrl = document.getElementById('custom-api-url').value;
      
      if (!customApiUrl) {
        showStatusMessage('请输入自定义API端点URL', 'error');
        return;
      }
      
      if (!modelValue) {
        showStatusMessage('请输入自定义模型标识符', 'error');
        return;
      }
      break;
  }
  
  if (!apiKey) {
    showStatusMessage('请输入API密钥', 'error');
    return;
  }
  
  // 保存设置
  const settings = {
    apiProvider: apiProvider,
    apiKey: apiKey
  };
  
  // 根据不同提供商保存不同的模型设置
  if (apiProvider === 'gemini') {
    settings.geminiModel = modelValue;
  } else if (apiProvider === 'openai') {
    settings.openaiModel = modelValue;
  } else if (apiProvider === 'custom') {
    settings.customModel = modelValue;
    settings.customApiUrl = customApiUrl;
  }
  
  chrome.storage.sync.set(settings, () => {
    showStatusMessage('API设置已保存', 'success');
  });
}

// 保存分类设置
function saveCategorySettings() {
  const defaultCategories = document.getElementById('default-categories').value;
  const batchSize = document.getElementById('batch-size').value;
  
  // 检查批处理大小是否为有效数字
  const batchSizeNum = parseInt(batchSize);
  if (isNaN(batchSizeNum) || batchSizeNum <= 0) {
    showStatusMessage('请输入有效的批处理数量', 'error');
    return;
  }
  
  // 保存设置
  chrome.storage.sync.set({
    defaultCategories: defaultCategories,
    batchSize: batchSizeNum
  }, () => {
    showStatusMessage('分类设置已保存', 'success');
  });
}

// 测试API连接
async function testApiConnection() {
  // 清空调试信息
  updateDebugInfo('', '', '', '');
  
  const apiProvider = document.getElementById('api-provider').value;
  const apiKey = document.getElementById('api-key').value;
  let customApiUrl = '';
  let modelValue = '';
  
  // 根据API提供商获取对应的模型值
  switch (apiProvider) {
    case 'gemini':
      modelValue = document.getElementById('gemini-model').value;
      break;
    case 'openai':
      modelValue = document.getElementById('openai-model').value;
      break;
    case 'custom':
      modelValue = document.getElementById('custom-model').value;
      customApiUrl = document.getElementById('custom-api-url').value;
      
      if (!customApiUrl) {
        showStatusMessage('请输入自定义API端点URL', 'error');
        return;
      }
      
      if (!modelValue) {
        showStatusMessage('请输入自定义模型标识符', 'error');
        return;
      }
      break;
  }
  
  if (!apiKey) {
    showStatusMessage('请输入API密钥', 'error');
    return;
  }
  
  showStatusMessage('正在测试API连接...', '');
  
  try {
    let success = false;
    
    switch (apiProvider) {
      case 'gemini':
        success = await testGeminiApi(apiKey, modelValue);
        break;
      case 'openai':
        success = await testOpenAiApi(apiKey, modelValue);
        break;
      case 'custom':
        success = await testCustomApi(apiKey, customApiUrl, modelValue);
        break;
    }
    
    if (success) {
      showStatusMessage('API连接成功！', 'success');
    } else {
      showStatusMessage('API连接失败，请检查API密钥和模型是否正确', 'error');
    }
  } catch (error) {
    console.error('API测试出错:', error);
    // 更新调试面板的错误信息
    document.getElementById('debug-error').textContent = error.toString();
    showStatusMessage(`API连接失败: ${error.message}`, 'error');
  }
}

// 测试Gemini API
async function testGeminiApi(apiKey, model) {
  try {
    // 构建URL，注意版本号和区域
    // 对于gemini-1.5系列模型，需要使用v1而非v1beta
    const apiVersion = model.startsWith('gemini-1.5') ? 'v1' : 'v1beta';
    
    const url = `https://generativelanguage.googleapis.com/${apiVersion}/models/${model}:generateContent?key=${apiKey}`;
    console.log(`正在测试Gemini API连接，URL: ${url}`);
    
    // 更新调试面板的URL信息
    document.getElementById('debug-url').textContent = url;
    
    // 准备请求内容
    const requestData = {
      contents: [{
        parts: [{
          text: '测试连接，请回复"连接成功"'
        }]
      }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 100
      }
    };
    
    // 更新调试面板的请求数据
    document.getElementById('debug-request').textContent = JSON.stringify(requestData, null, 2);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    });
    
    let responseData;
    try {
      responseData = await response.json();
    } catch (e) {
      responseData = { error: "无法解析响应为JSON" };
    }
    
    // 更新调试面板的响应数据
    document.getElementById('debug-response').textContent = JSON.stringify(responseData, null, 2);
    
    if (!response.ok) {
      console.error('Gemini API错误响应:', responseData);
      throw new Error(`API响应错误: ${response.status} ${response.statusText} - ${responseData.error?.message || JSON.stringify(responseData)}`);
    }
    
    console.log('Gemini API响应:', responseData);
    
    if (!responseData.candidates || responseData.candidates.length === 0) {
      throw new Error('API返回数据无效，没有candidates');
    }
    
    return true;
  } catch (error) {
    console.error('Gemini API测试出错:', error);
    throw error;
  }
}

// 测试OpenAI API
async function testOpenAiApi(apiKey, model) {
  try {
    const url = 'https://api.openai.com/v1/chat/completions';
    console.log(`正在测试OpenAI API连接，模型: ${model}`);
    
    // 更新调试面板的URL信息
    document.getElementById('debug-url').textContent = url;
    
    // 准备请求内容
    const requestData = {
      model: model,
      messages: [
        {
          role: 'user',
          content: '测试连接，请回复"连接成功"'
        }
      ],
      max_tokens: 10
    };
    
    // 更新调试面板的请求数据
    document.getElementById('debug-request').textContent = JSON.stringify(requestData, null, 2);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestData)
    });
    
    let responseData;
    try {
      responseData = await response.json();
    } catch (e) {
      responseData = { error: "无法解析响应为JSON" };
    }
    
    // 更新调试面板的响应数据
    document.getElementById('debug-response').textContent = JSON.stringify(responseData, null, 2);
    
    if (!response.ok) {
      console.error('OpenAI API错误响应:', responseData);
      throw new Error(`API响应错误: ${response.status} ${response.statusText} - ${responseData.error?.message || JSON.stringify(responseData)}`);
    }
    
    console.log('OpenAI API响应:', responseData);
    
    return responseData && responseData.choices && responseData.choices.length > 0;
  } catch (error) {
    console.error('OpenAI API测试出错:', error);
    throw error;
  }
}

// 测试自定义API
async function testCustomApi(apiKey, customApiUrl, model) {
  try {
    console.log(`正在测试自定义API连接，URL: ${customApiUrl}, 模型: ${model}`);
    
    // 更新调试面板的URL信息
    document.getElementById('debug-url').textContent = customApiUrl;
    
    // 准备请求内容 - 提供多种可能的消息格式，增加兼容性
    const requestData = {
      model: model,
      prompt: '测试连接，请回复"连接成功"',
      message: '测试连接，请回复"连接成功"',
      // 兼容更多API格式
      messages: [
        { role: "user", content: '测试连接，请回复"连接成功"' }
      ],
      content: '测试连接，请回复"连接成功"',
      input: '测试连接，请回复"连接成功"'
    };
    
    // 更新调试面板的请求数据
    document.getElementById('debug-request').textContent = JSON.stringify(requestData, null, 2);
    
    const response = await fetch(customApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestData)
    });
    
    let responseData;
    try {
      responseData = await response.json();
    } catch (e) {
      responseData = { error: "无法解析响应为JSON" };
    }
    
    // 更新调试面板的响应数据
    document.getElementById('debug-response').textContent = JSON.stringify(responseData, null, 2);
    
    if (!response.ok) {
      console.error('自定义API错误响应:', responseData);
      throw new Error(`API响应错误: ${response.status} ${response.statusText} - ${JSON.stringify(responseData)}`);
    }
    
    return true;
  } catch (error) {
    console.error('自定义API测试出错:', error);
    throw error;
  }
}

// 显示状态信息
function showStatusMessage(message, type) {
  const statusElement = document.getElementById('status-message');
  statusElement.textContent = message;
  statusElement.classList.remove('hidden', 'success', 'error');
  
  if (type) {
    statusElement.classList.add(type);
  }
}

// 根据所选API提供商显示相应的设置部分
function updateApiProviderSections() {
  const provider = document.getElementById('api-provider').value;
  const geminiSection = document.getElementById('gemini-api-section');
  const openaiSection = document.getElementById('openai-api-section');
  const customSection = document.getElementById('custom-api-section');
  
  geminiSection.style.display = provider === 'gemini' ? 'block' : 'none';
  openaiSection.style.display = provider === 'openai' ? 'block' : 'none';
  customSection.style.display = provider === 'custom' ? 'block' : 'none';
}

// 保存设置
function saveOptions() {
  const settings = {
    apiProvider: document.getElementById('api-provider').value,
    apiKey: document.getElementById('api-key').value.trim(),
    model: document.getElementById('model').value,
    openaiApiKey: document.getElementById('openai-api-key').value.trim(),
    openaiModel: document.getElementById('openai-model').value,
    customApiKey: document.getElementById('custom-api-key').value.trim(),
    customApiUrl: document.getElementById('custom-api-url').value.trim(),
    customModel: document.getElementById('custom-model').value.trim(),
    batchSize: parseInt(document.getElementById('batch-size').value, 10),
    customCategories: customCategories,
    useCustomPrompt: document.getElementById('custom-prompt-checkbox').checked,
    customPrompt: document.getElementById('custom-prompt').value
  };

  chrome.storage.sync.set(settings, function() {
    showStatusMessage('设置已保存！');
  });
}

// 初始化设置页面
document.addEventListener('DOMContentLoaded', function() {
  // 设置各个输入字段的值
  chrome.storage.sync.get({
    apiProvider: 'gemini',
    apiKey: '',
    model: 'gemini-1.5-pro-latest',
    openaiApiKey: '',
    openaiModel: 'gpt-4o',
    customApiKey: '',
    customApiUrl: '',
    customModel: '',
    batchSize: 10,
    customCategories: {},
    useCustomPrompt: false,
    customPrompt: DEFAULT_PROMPT_TEMPLATE
  }, function(settings) {
    document.getElementById('api-provider').value = settings.apiProvider;
    document.getElementById('api-key').value = settings.apiKey;
    document.getElementById('model').value = settings.model;
    document.getElementById('openai-api-key').value = settings.openaiApiKey;
    document.getElementById('openai-model').value = settings.openaiModel;
    document.getElementById('custom-api-key').value = settings.customApiKey;
    document.getElementById('custom-api-url').value = settings.customApiUrl;
    document.getElementById('custom-model').value = settings.customModel;
    document.getElementById('batch-size').value = settings.batchSize;
    document.getElementById('custom-prompt-checkbox').checked = settings.useCustomPrompt;
    document.getElementById('custom-prompt').value = settings.customPrompt;
    
    if (settings.useCustomPrompt) {
      document.getElementById('custom-prompt-container').style.display = 'block';
    }
    
    updateCustomCategoriesUI(settings.customCategories);
    updateApiProviderSections();
  });
  
  // 设置事件处理器
  document.getElementById('api-provider').addEventListener('change', updateApiProviderSections);
  document.getElementById('save-button').addEventListener('click', saveOptions);
  document.getElementById('test-gemini-api').addEventListener('click', testGeminiAPI);
  document.getElementById('test-openai-api').addEventListener('click', testOpenAiAPI);
  document.getElementById('test-custom-api').addEventListener('click', testCustomAPI);
  document.getElementById('custom-prompt-checkbox').addEventListener('change', function() {
    document.getElementById('custom-prompt-container').style.display = 
      this.checked ? 'block' : 'none';
  });
  document.getElementById('add-category').addEventListener('click', addCustomCategory);
  document.getElementById('save-category-settings').addEventListener('click', saveCustomCategorySettings);
});

// 测试自定义API连接
async function testCustomAPI() {
  const apiKey = document.getElementById('custom-api-key').value.trim();
  const customApiUrl = document.getElementById('custom-api-url').value.trim();
  const model = document.getElementById('custom-model').value.trim();
  
  if (!apiKey) {
    showStatusMessage('请输入API密钥', true);
    return;
  }
  
  if (!customApiUrl) {
    showStatusMessage('请输入自定义API URL', true);
    return;
  }
  
  if (!model) {
    showStatusMessage('请输入模型名称', true);
    return;
  }
  
  document.getElementById('test-custom-api').disabled = true;
  showStatusMessage('正在测试自定义API连接...', false, false);
  
  try {
    await testCustomApi(apiKey, customApiUrl, model);
    showStatusMessage('✅ 自定义API连接成功！', false, true);
  } catch (error) {
    console.error('自定义API连接测试失败:', error);
    showStatusMessage(`❌ 自定义API连接失败: ${error.message}`, true, true);
  } finally {
    document.getElementById('test-custom-api').disabled = false;
  }
} 