/**
 * API服务模块 - 处理各种AI API调用
 */

export class ApiService {
  constructor() {
    this.logCallback = null;
    this.isExtensionContext = typeof chrome !== 'undefined' && chrome.storage;
  }

  setLogCallback(callback) {
    this.logCallback = callback;
  }

  log(message, type = 'info') {
    if (this.logCallback) {
      this.logCallback(message, type);
    }
  }

  // 获取API设置
  async getApiSettings() {
    if (!this.isExtensionContext) {
      // 浏览器测试环境下的模拟设置
      const mockSettings = {
        provider: 'gemini',
        apiKey: 'test-api-key',
        customApiUrl: '',
        model: 'gemini-2.0-flash',
        defaultCategories: 'AI工具,设计工具,开发工具,娱乐,购物,学习',
        batchSize: 50
      };
      this.log('浏览器测试模式: 使用模拟API设置', 'info');
      return Promise.resolve(mockSettings);
    }
    
    return new Promise((resolve) => {
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
        const apiProvider = result.apiProvider || 'gemini';
        let model = '';
        
        switch (apiProvider) {
          case 'gemini':
            model = result.geminiModel || 'gemini-2.0-flash';
            break;
          case 'openai':
            model = result.openaiModel || 'gpt-3.5-turbo';
            break;
          case 'custom':
            model = result.customModel || '';
            break;
        }
        
        resolve({
          provider: apiProvider,
          apiKey: result.apiKey || '',
          customApiUrl: result.customApiUrl || '',
          model: model,
          defaultCategories: result.defaultCategories || '技术,教育,购物,社交媒体,新闻,娱乐,工作,其他',
          batchSize: result.batchSize || 50
        });
      });
    });
  }

  // 检查API连接状态
  checkApiStatus() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['apiProvider', 'apiKey'], (result) => {
        const isConnected = !!(result.apiProvider && result.apiKey);
        resolve({
          connected: isConnected,
          provider: result.apiProvider || null
        });
      });
    });
  }

  // 调用Gemini API
  async callGeminiApi(prompt, apiKey, model) {
    try {
      const apiVersion = model.startsWith('gemini-1.5') ? 'v1' : 'v1beta';
      const url = `https://generativelanguage.googleapis.com/${apiVersion}/models/${model}:generateContent?key=${apiKey}`;
      
      this.log(`正在调用Gemini API，模型: ${model}`, 'info');
      
      const requestData = {
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 2048
        }
      };
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        this.log(`Gemini API错误: ${response.status} ${response.statusText}`, 'error');
        throw new Error(`API错误: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.candidates || data.candidates.length === 0) {
        this.log(`Gemini API返回无效数据，没有candidates`, 'error');
        throw new Error('API返回数据无效，没有candidates');
      }
      
      const responseText = data.candidates[0].content.parts[0].text;
      this.log(`成功获取API响应，内容长度: ${responseText.length}字符`, 'success');
      
      return this.parseJsonResponse(responseText);
    } catch (error) {
      this.log(`Gemini API调用失败: ${error.message}`, 'error');
      throw new Error(`Gemini API调用失败: ${error.message}`);
    }
  }

  // 调用OpenAI API
  async callOpenAiApi(prompt, apiKey, model) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: 'system',
              content: '你是一个书签分类助手，请将用户提供的书签分类，并以JSON格式返回。'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3
        })
      });
      
      if (!response.ok) {
        throw new Error(`API错误: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      const responseText = data.choices[0].message.content;
      this.log(`成功获取OpenAI API响应，内容长度: ${responseText.length}字符`, 'success');
      
      return this.parseJsonResponse(responseText);
    } catch (error) {
      this.log(`OpenAI API调用失败: ${error.message}`, 'error');
      throw new Error(`OpenAI API调用失败: ${error.message}`);
    }
  }

  // 调用自定义API
  async callCustomApi(apiKey, customApiUrl, model, prompt) {
    try {
      this.log(`正在调用自定义API，模型: ${model}`, 'info');
      
      const requestData = {
        model: model,
        prompt: prompt,
        message: prompt,
        messages: [
          { role: "user", content: prompt }
        ],
        content: prompt,
        input: prompt
      };

      const response = await fetch(customApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(requestData)
      });

      const responseData = await response.json();
      if (!response.ok) {
        this.log(`自定义API错误: ${response.status} ${response.statusText}`, 'error');
        throw new Error(`API响应错误: ${response.status} - ${JSON.stringify(responseData)}`);
      }

      this.log(`自定义API请求成功，正在处理响应...`, 'info');

      // 处理不同格式的API响应
      let resultText = '';
      
      if (typeof responseData === 'string') {
        resultText = responseData;
      } else if (responseData.text || responseData.content || responseData.message || responseData.response) {
        resultText = responseData.text || responseData.content || responseData.message || responseData.response;
      } else if (responseData.choices && responseData.choices.length > 0) {
        resultText = responseData.choices[0].text || responseData.choices[0].message?.content;
      } else if (responseData.result) {
        if (typeof responseData.result === 'string') {
          resultText = responseData.result;
        } else {
          this.log(`检测到result字段为对象，直接返回`, 'info');
          return responseData.result;
        }
      } else {
        this.log(`未找到标准结果字段，尝试使用整个响应`, 'warning');
        resultText = JSON.stringify(responseData);
      }

      if (!resultText) {
        throw new Error('无法从API响应中提取文本内容');
      }

      this.log(`成功获取API响应，内容长度: ${resultText.length}字符`, 'success');
      return this.parseJsonResponse(resultText);
    } catch (error) {
      this.log(`自定义API调用失败: ${error.message}`, 'error');
      throw new Error(`自定义API调用失败: ${error.message}`);
    }
  }

  // 解析JSON响应
  parseJsonResponse(responseText) {
    const jsonText = this.extractJsonFromText(responseText);
    return this.parseJsonWithRecovery(jsonText);
  }

  // 从文本中提取JSON
  extractJsonFromText(responseText) {
    this.log(`正在从响应中提取JSON数据...`, 'info');
    
    let jsonText = '';
    
    // 寻找完整的JSON代码块
    const codeBlockMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/) || 
                           responseText.match(/```\s*([\s\S]*?)\s*```/);
    
    if (codeBlockMatch) {
      jsonText = codeBlockMatch[1].trim();
      this.log(`从代码块中提取JSON，长度: ${jsonText.length}字符`, 'success');
    } else {
      // 寻找第一个完整的JSON对象
      const jsonObjectMatch = responseText.match(/{[\s\S]*}/);
      if (jsonObjectMatch) {
        jsonText = jsonObjectMatch[0];
        this.log(`从文本中提取JSON对象，长度: ${jsonText.length}字符`, 'success');
      } else {
        jsonText = responseText.trim();
        this.log(`未找到JSON格式标记，使用整个响应作为JSON`, 'warning');
      }
    }
    
    return jsonText;
  }

  // 带恢复功能的JSON解析
  parseJsonWithRecovery(jsonStr) {
    try {
      return JSON.parse(jsonStr);
    } catch (firstError) {
      this.log(`初次JSON解析失败: ${firstError.message}`, 'warning');
      
      let fixedJson = jsonStr;
      
      // 步骤1: 提取最外层的JSON对象
      const cleanMatch = fixedJson.match(/{[\s\S]*}/);
      if (cleanMatch) {
        fixedJson = cleanMatch[0];
      }
      
      // 步骤2: 修复常见的JSON格式问题
      // 移除多余的逗号
      fixedJson = fixedJson.replace(/,(\s*[}\]])/g, '$1');
      
      // 修复属性名缺少引号的问题
      fixedJson = fixedJson.replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":');
      
      // 修复字符串值缺少引号的问题（但要避免影响已有的引号）
      fixedJson = fixedJson.replace(/:\s*([^",\[\]{}][^,\[\]{}]*?)(\s*[,}\]])/g, ': "$1"$2');
      
      // 步骤3: 处理不完整的JSON结构
      const openBraces = (fixedJson.match(/{/g) || []).length;
      const closeBraces = (fixedJson.match(/}/g) || []).length;
      const openBrackets = (fixedJson.match(/\[/g) || []).length;
      const closeBrackets = (fixedJson.match(/]/g) || []).length;
      
      // 补全缺失的闭合符号
      for (let i = 0; i < openBraces - closeBraces; i++) {
        fixedJson += '}';
      }
      for (let i = 0; i < openBrackets - closeBrackets; i++) {
        fixedJson += ']';
      }
      
      // 步骤4: 处理数组中的格式问题
      // 修复数组元素间缺少逗号的问题
      fixedJson = fixedJson.replace(/}\s*{/g, '}, {');
      fixedJson = fixedJson.replace(/]\s*\[/g, '], [');
      
      // 步骤5: 清理多余的空白字符
      fixedJson = fixedJson.replace(/\s+/g, ' ').trim();
      
      try {
        const result = JSON.parse(fixedJson);
        this.log(`JSON修复成功`, 'success');
        return result;
      } catch (secondError) {
        this.log(`JSON修复后仍然解析失败: ${secondError.message}`, 'error');
        
        // 最后的尝试：截断到最后一个有效的JSON结构
        try {
          const truncatedJson = this.truncateToValidJson(fixedJson);
          if (truncatedJson) {
            const result = JSON.parse(truncatedJson);
            this.log(`通过截断修复JSON成功`, 'success');
            return result;
          }
        } catch (truncateError) {
          this.log(`截断修复也失败: ${truncateError.message}`, 'error');
        }
        
        throw new Error(`JSON解析失败，已尝试多种修复方案: ${firstError.message}`);
      }
    }
  }

  // 截断到最后一个有效的JSON结构
  truncateToValidJson(jsonStr) {
    // 尝试找到最后一个完整的对象
    let braceCount = 0;
    let lastValidIndex = -1;
    
    for (let i = 0; i < jsonStr.length; i++) {
      const char = jsonStr[i];
      if (char === '{') {
        braceCount++;
      } else if (char === '}') {
        braceCount--;
        if (braceCount === 0) {
          lastValidIndex = i;
        }
      }
    }
    
    if (lastValidIndex > 0) {
      return jsonStr.substring(0, lastValidIndex + 1);
    }
    
    return null;
  }
}
