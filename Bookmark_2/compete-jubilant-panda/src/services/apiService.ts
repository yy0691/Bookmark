/**
 * API服务模块 - React Hook 版本
 * 处理AI API调用和网络连接检测
 */

import { useState, useCallback } from 'react';

export interface ApiSettings {
  provider: 'openai' | 'gemini' | 'custom';
  apiKey: string;
  model: string;
  customApiUrl?: string;
}

export interface ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export const useApiService = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 检查网络连接
  const checkNetworkConnection = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch('https://www.google.com', { 
        method: 'HEAD', 
        mode: 'no-cors',
        cache: 'no-cache'
      });
      setIsConnected(true);
      return true;
    } catch (error) {
      setIsConnected(false);
      return false;
    }
  }, []);

  // 验证API密钥格式
  const validateApiKey = useCallback((apiKey: string, provider: string): { valid: boolean; error?: string } => {
    if (!apiKey || apiKey.trim() === '') {
      return { valid: false, error: 'API密钥不能为空' };
    }

    switch (provider) {
      case 'openai':
        if (!apiKey.startsWith('sk-')) {
          return { valid: false, error: 'OpenAI API密钥格式不正确，应以"sk-"开头' };
        }
        break;
      case 'gemini':
        if (!apiKey.includes('AIza')) {
          return { valid: false, error: 'Gemini API密钥格式不正确' };
        }
        break;
      case 'custom':
        try {
          new URL(apiKey);
        } catch {
          return { valid: false, error: '自定义API URL格式不正确' };
        }
        break;
    }

    return { valid: true };
  }, []);

  // 调用OpenAI API
  const callOpenAiApi = useCallback(async (
    prompt: string, 
    apiKey: string, 
    model: string = 'gpt-3.5-turbo'
  ): Promise<ApiResponse> => {
    setIsLoading(true);
    setError(null);

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
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 2000
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API错误: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.choices && data.choices[0] && data.choices[0].message) {
        const content = data.choices[0].message.content;
        
        // 尝试解析JSON响应
        try {
          const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
          if (jsonMatch) {
            const jsonData = JSON.parse(jsonMatch[1]);
            return { success: true, data: jsonData };
          } else {
            // 如果没有找到JSON代码块，尝试直接解析
            const jsonData = JSON.parse(content);
            return { success: true, data: jsonData };
          }
        } catch (parseError) {
          console.error('JSON解析失败:', parseError);
          return { success: false, error: 'API返回的数据格式不正确' };
        }
      } else {
        return { success: false, error: 'API返回的数据格式不正确' };
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'API调用失败';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 调用Gemini API
  const callGeminiApi = useCallback(async (
    prompt: string, 
    apiKey: string, 
    model: string = 'gemini-pro'
  ): Promise<ApiResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2000
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API错误: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        const content = data.candidates[0].content.parts[0].text;
        
        // 尝试解析JSON响应
        try {
          const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
          if (jsonMatch) {
            const jsonData = JSON.parse(jsonMatch[1]);
            return { success: true, data: jsonData };
          } else {
            // 如果没有找到JSON代码块，尝试直接解析
            const jsonData = JSON.parse(content);
            return { success: true, data: jsonData };
          }
        } catch (parseError) {
          console.error('JSON解析失败:', parseError);
          return { success: false, error: 'API返回的数据格式不正确' };
        }
      } else {
        return { success: false, error: 'API返回的数据格式不正确' };
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'API调用失败';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 调用自定义API
  const callCustomApi = useCallback(async (
    apiKey: string,
    customApiUrl: string,
    model: string,
    prompt: string
  ): Promise<ApiResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(customApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model,
          prompt: prompt,
          temperature: 0.7,
          max_tokens: 2000
        })
      });

      if (!response.ok) {
        throw new Error(`自定义API错误: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return { success: true, data: data };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'API调用失败';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 通用API调用方法
  const callApi = useCallback(async (
    settings: ApiSettings,
    prompt: string
  ): Promise<ApiResponse> => {
    switch (settings.provider) {
      case 'openai':
        return callOpenAiApi(prompt, settings.apiKey, settings.model);
      case 'gemini':
        return callGeminiApi(prompt, settings.apiKey, settings.model);
      case 'custom':
        if (!settings.customApiUrl) {
          return { success: false, error: '自定义API URL未设置' };
        }
        return callCustomApi(settings.apiKey, settings.customApiUrl, settings.model, prompt);
      default:
        return { success: false, error: '不支持的API提供商' };
    }
  }, [callOpenAiApi, callGeminiApi, callCustomApi]);

  return {
    isConnected,
    isLoading,
    error,
    checkNetworkConnection,
    validateApiKey,
    callOpenAiApi,
    callGeminiApi,
    callCustomApi,
    callApi
  };
};
