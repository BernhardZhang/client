class CozeService {
  constructor() {
    this.config = null;
    this.loadConfig();
  }

  async loadConfig() {
    try {
      const response = await fetch('/config.json');
      const config = await response.json();
      this.config = config.COZE;
    } catch (error) {
      console.error('Failed to load Coze config:', error);
    }
  }

  async ensureConfig() {
    if (!this.config) {
      await this.loadConfig();
    }
    return this.config;
  }

  async chatStream(message, conversationHistory = [], userId = null, fileIds = [], conversationId = null) {

    const config = await this.ensureConfig();
    if (!config) {
      throw new Error('Coze configuration not loaded');
    }

    // 使用传入的userId，如果没有则使用默认值
    const actualUserId = userId || 'anonymous_user';
    console.log('Coze API调用信息:', {
      userId: actualUserId,
      messageLength: message.length,
      historyCount: conversationHistory.length,
      fileCount: fileIds?.length || 0,
      conversationId: conversationId || 'new',
      botId: config.bot_id
    });

    // 使用传入的conversationId，如果没有则生成新的
    const actualConversationId = conversationId || this.generateConversationId();

    // 根据是否有文件决定使用不同的请求格式
    let requestBody;

    if (fileIds && fileIds.length > 0) {
      // 有文件时：使用多模态消息格式
      const messageContent = [];

      // 添加文件引用
      fileIds.forEach(fileInfo => {
        messageContent.push({
          "content_type": "file",
          "content": {
            "text": "",
            "image_url": null,
            "file_url": {
              "url": fileInfo.id,
              "file_name": fileInfo.fileName || fileInfo.name || "uploaded_file",
              "suffix_type": fileInfo.suffixType || this.getFileSuffixType(fileInfo.fileName || fileInfo.name) || "pdf"
            }
          }
        });
      });

      // 添加用户的文本消息
      messageContent.push({
        "content_type": "text",
        "content": {
          "text": message,
          "image_url": null,
          "file_url": null
        }
      });

      requestBody = {
        conversation_id: actualConversationId,
        bot_id: config.bot_id,
        user: actualUserId,
        query: messageContent,
        chat_history: conversationHistory.map(msg => ({
          role: msg.role,
          content: msg.content,
          content_type: 'text'
        })),
        stream: false
      };
    } else {
      // 无文件时：使用简单文本格式
      requestBody = {
        conversation_id: actualConversationId,
        bot_id: config.bot_id,
        user: actualUserId,
        query: message,
        chat_history: conversationHistory.map(msg => ({
          role: msg.role,
          content: msg.content,
          content_type: 'text'
        })),
        stream: false
      };
    }

    console.log('Coze API完整请求体:', JSON.stringify(requestBody, null, 2));

    try {
      const response = await fetch(`${config.baseURL}/open_api/v2/chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      console.log('Coze API响应状态:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Coze API错误响应:', errorText);
        throw new Error(`Coze API错误 ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('Coze API响应数据:', data);

      if (data.code !== 0) {
        throw new Error(`Coze API返回错误: ${data.msg || '未知错误'}`);
      }

      const messages_data = data.messages || [];
      const assistantMessage = messages_data.find(msg => msg.role === 'assistant' && msg.type === 'answer');

      if (assistantMessage) {
        // 返回消息内容和会话ID
        return {
          content: assistantMessage.content,
          conversationId: actualConversationId,
          chatId: data.chat_id || null
        };
      } else {
        console.warn('未找到助手回复消息', messages_data);
        return {
          content: '抱歉，我暂时无法回答您的问题。',
          conversationId: actualConversationId,
          chatId: null
        };
      }
    } catch (error) {
      console.error('Coze API调用失败:', error);
      throw error;
    }
  }

  async chatStreamWithSSE(message, conversationHistory = [], onMessage) {
    const config = await this.ensureConfig();
    if (!config) {
      throw new Error('Coze configuration not loaded');
    }

    try {
      const response = await fetch(`${config.baseURL}/open_api/v2/chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversation_id: this.generateConversationId(),
          bot_id: config.bot_id,
          user: config.user_id,
          query: message,
          chat_history: conversationHistory.map(msg => ({
            role: msg.role,
            content: msg.content,
            content_type: 'text'
          })),
          stream: true
        })
      });

      if (!response.ok) {
        throw new Error(`Coze API error: ${response.status} ${response.statusText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.event === 'conversation.message.delta' && data.data?.content) {
                onMessage(data.data.content);
              }
            } catch {
              // Ignore JSON parse errors
            }
          }
        }
      }
    } catch (error) {
      throw error;
    }
  }

  generateConversationId() {
    return 'conv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  async getConfig() {
    return await this.ensureConfig();
  }

  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }

  getFileSuffixType(fileName) {
    if (!fileName) return 'unknown';
    const extension = fileName.toLowerCase().split('.').pop();

    // Map common file extensions to suffix types
    const suffixMap = {
      'pdf': 'pdf',
      'doc': 'doc',
      'docx': 'docx',
      'txt': 'txt',
      'md': 'md',
      'jpg': 'jpg',
      'jpeg': 'jpeg',
      'png': 'png',
      'gif': 'gif',
      'xlsx': 'xlsx',
      'xls': 'xls',
      'ppt': 'ppt',
      'pptx': 'pptx'
    };

    return suffixMap[extension] || extension || 'unknown';
  }

  async uploadFile(file) {
    const config = await this.ensureConfig();
    if (!config) {
      throw new Error('Coze configuration not loaded');
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${config.baseURL}/v1/files/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.token}`,
        },
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`File upload failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (data.code !== 0) {
        throw new Error(`Coze file upload error: ${data.msg || 'Unknown error'}`);
      }

      return {
        id: data.data.id,
        fileName: data.data.file_name,
        bytes: data.data.bytes,
        createdAt: data.data.created_at,
        fileUrl: data.data.download_url || data.data.url || data.data.id, // Use actual URL if available
        suffixType: this.getFileSuffixType(data.data.file_name)
      };
    } catch (error) {
      throw error;
    }
  }

  async retrieveChat(conversationId, chatId) {
    const config = await this.ensureConfig();
    if (!config) {
      throw new Error('Coze configuration not loaded');
    }

    try {
      const response = await fetch(`${config.baseURL}/v3/chat/retrieve?conversation_id=${conversationId}&chat_id=${chatId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${config.token}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Chat retrieve failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (data.code !== 0) {
        throw new Error(`Coze chat retrieve error: ${data.msg || 'Unknown error'}`);
      }

      return data.data;
    } catch (error) {
      throw error;
    }
  }

  async getConversationMessages(conversationId) {
    const config = await this.ensureConfig();
    if (!config) {
      throw new Error('Coze configuration not loaded');
    }

    try {
      // 注意：这里使用推测的API端点，可能需要根据实际API文档调整
      const response = await fetch(`${config.baseURL}/v3/chat/message/list?conversation_id=${conversationId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${config.token}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Get conversation messages failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (data.code !== 0) {
        throw new Error(`Coze get messages error: ${data.msg || 'Unknown error'}`);
      }

      return data.data || [];
    } catch (error) {
      throw error;
    }
  }

  // 本地存储对话历史的方法
  saveConversationToLocal(projectId, conversationId, messages) {
    const key = `coze_conversation_${projectId}`;
    const conversationData = {
      conversationId,
      messages,
      lastUpdated: Date.now()
    };
    localStorage.setItem(key, JSON.stringify(conversationData));
  }

  loadConversationFromLocal(projectId) {
    const key = `coze_conversation_${projectId}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.warn('Failed to parse stored conversation:', e);
      }
    }
    return null;
  }

  clearConversationFromLocal(projectId) {
    const key = `coze_conversation_${projectId}`;
    localStorage.removeItem(key);
  }

  // 文件持久化方法
  saveUploadedFilesToLocal(projectId, files) {
    const key = `coze_files_${projectId}`;
    const filesData = {
      files,
      lastUpdated: Date.now()
    };
    localStorage.setItem(key, JSON.stringify(filesData));
  }

  loadUploadedFilesFromLocal(projectId) {
    const key = `coze_files_${projectId}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return parsed.files || [];
      } catch (e) {
        console.warn('Failed to parse stored files:', e);
      }
    }
    return [];
  }

  clearUploadedFilesFromLocal(projectId) {
    const key = `coze_files_${projectId}`;
    localStorage.removeItem(key);
  }

  // 同时清除对话和文件的方法
  clearAllDataFromLocal(projectId) {
    this.clearConversationFromLocal(projectId);
    this.clearUploadedFilesFromLocal(projectId);
  }
}

export default new CozeService();