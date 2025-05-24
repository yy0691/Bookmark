// 测试自定义API连接的脚本
async function testCustomApiConnection() {
  // 配置
  const apiKey = '您的API密钥';
  const customApiUrl = '您的自定义API URL';
  const model = '您的模型名称';
  
  try {
    console.log(`测试自定义API连接，URL: ${customApiUrl}, 模型: ${model}`);
    
    // 准备请求内容
    const requestData = {
      model: model,
      prompt: '测试连接，请回复"连接成功"',
      message: '测试连接，请回复"连接成功"'
    };
    
    console.log('请求数据:', JSON.stringify(requestData, null, 2));
    
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
      console.log('响应数据:', JSON.stringify(responseData, null, 2));
    } catch (e) {
      console.error('无法解析响应为JSON:', e);
      const text = await response.text();
      console.log('原始响应文本:', text);
      responseData = { error: "无法解析响应为JSON" };
    }
    
    if (!response.ok) {
      console.error('自定义API错误响应:', responseData);
      console.error(`API响应错误: ${response.status} ${response.statusText}`);
    } else {
      console.log('API连接成功!');
    }
    
    return responseData;
  } catch (error) {
    console.error('自定义API测试出错:', error);
    return { error: error.message };
  }
}

// 运行测试
testCustomApiConnection().then(result => {
  console.log('测试完成');
}).catch(err => {
  console.error('测试执行出错:', err);
}); 