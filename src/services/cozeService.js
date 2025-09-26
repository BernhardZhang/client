import { CozeAPI } from '@coze/api';

class CozeService {
  constructor() {
    this.config = null;
    this.apiClient = null;
    this.loadConfig();
  }

  async loadConfig() {
    try {
      const response = await fetch('/config.json');
      const config = await response.json();
      this.config = config.COZE;

      // Initialize Coze API client
      if (this.config) {
        this.apiClient = new CozeAPI({
          token: this.config.token,
          baseURL: this.config.baseURL,
          allowPersonalAccessTokenInBrowser: true
        });
      }
    } catch (error) {
      console.error('Failed to load Coze config:', error);
    }
  }

  async ensureConfig() {
    if (!this.config || !this.apiClient) {
      await this.loadConfig();
    }
    return this.config;
  }

  async chatStream(message, conversationHistory = [], userId = null, fileIds = [], conversationId = null, onMessage = null) {
    const config = await this.ensureConfig();
    if (!config || !this.apiClient) {
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

    // 构建消息数组，参考您提供的JavaScript示例
    const messages = [];

    // 添加文本消息
    if (fileIds && fileIds.length > 0) {
      // 有文件时：使用多模态格式
      const contentArray = [];

      // 添加文本
      contentArray.push({
        "type": "text",
        "text": message
      });

      // 添加文件引用
      fileIds.forEach(fileInfo => {
        const isImage = this.isImageFile(fileInfo.fileName || fileInfo.name);
        contentArray.push({
          "type": isImage ? "image" : "file",
          "file_id": fileInfo.id
        });
      });

      messages.push({
        "content": JSON.stringify(contentArray),
        "content_type": "object_string",
        "role": "user",
        "type": "question"
      });
    } else {
      // 无文件时：使用简单文本格式，参考JavaScript示例
      messages.push({
        "content": message,
        "content_type": "text",
        "role": "user",
        "type": "question"
      });
    }

    console.log('Coze API流式请求消息:', JSON.stringify(messages, null, 2));

    try {
      // 构建请求参数，包含conversation_id以复用对话
      const streamParams = {
        bot_id: config.bot_id,
        user_id: actualUserId,
          auto_save_history: true,
        additional_messages: messages
      };

      // 如果有conversation_id，添加到参数中以复用对话
      if (conversationId) {
        streamParams.conversation_id = conversationId;
      }

      console.log('Coze API流式请求参数:', streamParams);

      // 使用SDK的流式方法，参考您提供的JavaScript示例
      const streamResponse = await this.apiClient.chat.stream(streamParams);

      let fullContent = '';
      let conversationIdFromResponse = null;
      let chatIdFromResponse = null;

      // 处理流式响应，参考SDK文档的异步迭代器模式
      for await (const chunk of streamResponse) {

        // 处理不同类型的流式事件
        if (chunk.event === 'conversation.message.delta' && chunk.data?.content) {
          // 增量内容
          const deltaContent = chunk.data.content;
          fullContent += deltaContent;

          // 实时回调显示增量内容
          if (onMessage) {
            onMessage(deltaContent, false); // false表示未完成
          }
        } else if (chunk.event === 'conversation.message.completed' && chunk.data) {
          // 消息完成
          conversationIdFromResponse = chunk.data.conversation_id;
          chatIdFromResponse = chunk.data.chat_id;

          if (onMessage) {
            onMessage('', true); // true表示完成
          }
        } else if (chunk.event === 'conversation.chat.completed') {
          // 整个对话完成
          console.log('对话完成');
        } else if (chunk.event === 'error') {
          throw new Error(`流式API错误: ${chunk.data?.message || '未知错误'}`);
        }
      }

      // 返回完整结果
      return {
        content: fullContent || '抱歉，我暂时无法回答您的问题。',
        conversationId: conversationIdFromResponse,
        chatId: chatIdFromResponse
      };

    } catch (error) {
      console.error('Coze流式API调用失败:', error);
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

  isImageFile(fileName) {
    if (!fileName) return false;
    const extension = fileName.toLowerCase().split('.').pop();
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'ico'];
    return imageExtensions.includes(extension);
  }

  async uploadFile(file) {
    const config = await this.ensureConfig();
    if (!config || !this.apiClient) {
      throw new Error('Coze configuration not loaded');
    }

    try {
      // 使用SDK的文件上传方法
      const uploadResult = await this.apiClient.files.upload({
        file: file
      });

      return {
        id: uploadResult.id,
        fileName: uploadResult.file_name,
        bytes: uploadResult.bytes,
        createdAt: uploadResult.created_at,
        fileUrl: uploadResult.download_url || uploadResult.url || uploadResult.id,
        suffixType: this.getFileSuffixType(uploadResult.file_name)
      };
    } catch (error) {
      console.error('Coze file upload failed:', error);
      throw error;
    }
  }

  async retrieveChat(conversationId, chatId) {
    const config = await this.ensureConfig();
    if (!config || !this.apiClient) {
      throw new Error('Coze configuration not loaded');
    }

    try {
      // 使用SDK的聊天检索方法
      const chatResult = await this.apiClient.chat.retrieve({
        conversation_id: conversationId,
        chat_id: chatId
      });

      return chatResult;
    } catch (error) {
      console.error('Coze chat retrieve failed:', error);
      throw error;
    }
  }

  async getConversationMessages(conversationId) {
    const config = await this.ensureConfig();
    if (!config || !this.apiClient) {
      throw new Error('Coze configuration not loaded');
    }

    try {
      // 使用SDK的消息列表方法
      const messagesResult = await this.apiClient.chat.message.list({
        conversation_id: conversationId
      });

      return messagesResult.data || [];
    } catch (error) {
      console.error('Get conversation messages failed:', error);
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

  async cancelChat(conversationId, chatId) {
    const config = await this.ensureConfig();
    if (!config || !this.apiClient) {
      throw new Error('Coze configuration not loaded');
    }

    try {
      // 调用Coze API取消对话
      const cancelResult = await fetch('https://api.coze.cn/v3/chat/cancel', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          chat_id: chatId,
          conversation_id: conversationId
        })
      });

      if (!cancelResult.ok) {
        const error = await cancelResult.text();
        throw new Error(`取消对话失败: ${error}`);
      }

      return await cancelResult.json();
    } catch (error) {
      console.error('Cancel chat failed:', error);
      throw error;
    }
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