import React, { useState, useRef, useEffect } from 'react';
import { Card, Row, Col, Input, Button, Upload, List, Avatar, Space, Typography, message, Tag, Popconfirm, Tooltip, Modal, Image, Spin, Alert } from 'antd';
import { UploadOutlined, SendOutlined, RobotOutlined, UserOutlined, PaperClipOutlined, DeleteOutlined, PlusOutlined, HistoryOutlined, ReloadOutlined, FileImageOutlined, FileOutlined, DatabaseOutlined, InfoCircleOutlined } from '@ant-design/icons';
import api from '../../services/api';
import cozeService from '../../services/cozeService';
import projectDetailsService from '../../services/projectDetailsService';
import useAuthStore from '../../stores/authStore';

const { TextArea } = Input;
const { Text } = Typography;

const ProjectAIAnalysis = ({ projectId, isProjectOwner }) => {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState([
    { role: 'assistant', content: '你好，我是基于Coze智能体的项目AI助手。我正在为您准备项目详情数据，稍后您就可以向我提问项目相关的任何问题。' }
  ]);
  const [displayMessages, setDisplayMessages] = useState([]); // 用于显示的消息，不包括背景消息
  const [input, setInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [lastChatId, setLastChatId] = useState(null);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const uploadedFilesRef = useRef([]);

  // 项目详情相关状态
  const [projectDetails, setProjectDetails] = useState(null);
  const [loadingProjectDetails, setLoadingProjectDetails] = useState(false);
  const [projectDetailsError, setProjectDetailsError] = useState(null);
  const [projectDetailsLoaded, setProjectDetailsLoaded] = useState(false);
  const [projectDetailsSentToAI, setProjectDetailsSentToAI] = useState(false);
  const [showProjectSummary, setShowProjectSummary] = useState(false);

  // 组件加载时恢复对话历史和文件列表，并自动生成项目详情
  useEffect(() => {
    // 重置所有状态，确保切换项目时清除之前的数据
    setMessages([
      { role: 'assistant', content: '你好，我是基于Coze智能体的项目AI助手。我正在为您准备项目详情数据，稍后您就可以向我提问项目相关的任何问题。' }
    ]);
    setDisplayMessages([]); // 初始化显示消息为空，等待用户真正开始对话
    setConversationId(null);
    setUploadedFiles([]);
    uploadedFilesRef.current = [];
    setProjectDetails(null);
    setProjectDetailsLoaded(false);
    setProjectDetailsSentToAI(false);
    setProjectDetailsError(null);

    const savedConversation = cozeService.loadConversationFromLocal(projectId);
    if (savedConversation && savedConversation.messages && savedConversation.messages.length > 1) {
      setMessages(savedConversation.messages);
      // 过滤掉系统消息，只显示用户和AI的真实对话
      const userMessages = savedConversation.messages.filter(msg =>
        !msg.content.includes('[系统消息]') &&
        !msg.content.includes('项目详情数据') &&
        !msg.content.includes('我已经了解了项目详情')
      );
      setDisplayMessages(userMessages);
      setConversationId(savedConversation.conversationId);
    }

    // 恢复上传的文件列表
    const savedFiles = cozeService.loadUploadedFilesFromLocal(projectId);
    if (savedFiles && savedFiles.length > 0) {
      setUploadedFiles(savedFiles);
      uploadedFilesRef.current = savedFiles;
      console.log(`已恢复 ${savedFiles.length} 个文件`);
    }

    // 自动生成项目详情
    generateProjectDetails();
  }, [projectId]);

  // 在后台发送项目详情给AI，不在界面显示
  const sendProjectDetailsToAI = async (projectDetails) => {
    if (projectDetailsSentToAI || !projectDetails || !projectDetails.structuredContent) {
      return;
    }

    try {
      console.log('开始向AI发送项目详情数据...');
      const userId = user?.id?.toString() || user?.username || `user_${Date.now()}`;

      // 将结构化数据转换为AI易理解的格式
      const projectDetailsMessage = `[项目详情数据] 项目"${projectDetails.projectName}"的完整信息：

${JSON.stringify(projectDetails.structuredContent, null, 2)}

这是项目的完整结构化数据，包含了项目基本信息、团队情况、任务执行、投票评价、功分分配等所有重要信息。请基于这些数据回答用户的问题和分析需求。`;

      // 使用Coze API发送项目详情，使用空的回调确保不更新界面
      const result = await cozeService.chatStream(projectDetailsMessage, [], userId, [], conversationId, (deltaContent, isCompleted) => {
        // 完全静默处理，不更新任何界面元素
        if (isCompleted) {
          console.log('项目详情背景数据发送完成');
        }
      });

      if (result && result.conversationId) {
        setConversationId(result.conversationId);
        setProjectDetailsSentToAI(true);
        console.log('项目详情已成功发送给AI，对话ID:', result.conversationId);
      }

    } catch (error) {
      console.error('发送项目详情给AI失败:', error);
      // 不显示错误信息给用户，因为这是后台操作
    }
  };

  // 生成项目详情
  const generateProjectDetails = async () => {
    if (loadingProjectDetails) return;

    setLoadingProjectDetails(true);
    setProjectDetailsError(null);

    try {
      console.log(`开始为项目 ${projectId} 生成详情数据`);

      const result = await projectDetailsService.exportProjectDetails(projectId);

      if (result.success) {
        setProjectDetails(result);
        setProjectDetailsLoaded(true);

        // 更新初始消息，告知用户项目数据已准备完成
        const projectSummary = projectDetailsService.generateProjectSummary(result);
        const welcomeMessage = `你好！我已经为您准备好了项目"${result.projectName}"的完整详情数据。

项目概况：${projectSummary}

数据包含：${projectDetailsService.formatDataSummary(result.dataSummary)}

现在您可以向我提问任何关于项目的问题，比如：
• 项目的进度如何？
• 团队成员的工作分配情况？
• 项目存在什么风险？
• 如何优化项目管理？

我会基于项目的实际数据为您提供准确的分析和建议。`;

        // 更新显示消息，向用户显示项目准备就绪的消息
        setDisplayMessages([{ role: 'assistant', content: welcomeMessage }]);

        message.success(`项目详情数据已生成完成！包含${projectDetailsService.formatDataSummary(result.dataSummary)}`);

        console.log('项目详情生成成功:', {
          projectName: result.projectName,
          dataSummary: result.dataSummary,
          markdownLength: result.markdownContent?.length || 0
        });

        // 在后台发送项目详情给AI，不在界面显示
        await sendProjectDetailsToAI(result);

      } else {
        throw new Error('项目详情生成失败');
      }
    } catch (error) {
      console.error('生成项目详情失败:', error);
      setProjectDetailsError(error.message);

      // 显示错误消息
      const errorMessage = `抱歉，项目详情数据加载失败：${error.message}

您仍然可以上传文件或直接向我提问，我会尽力协助您进行项目分析。`;

      setDisplayMessages([{ role: 'assistant', content: errorMessage }]);

      message.error(`项目详情生成失败：${error.message}`);
    } finally {
      setLoadingProjectDetails(false);
    }
  };

  // 手动重新生成项目详情
  const regenerateProjectDetails = async () => {
    setProjectDetailsLoaded(false);
    await generateProjectDetails();
  };

  // 保存对话历史到本地存储
  const saveConversationHistory = (newMessages, convId) => {
    if (convId && newMessages.length > 1) {
      cozeService.saveConversationToLocal(projectId, convId, newMessages);
    }
  };

  // 保存文件列表到本地存储
  const saveUploadedFiles = (files) => {
    cozeService.saveUploadedFilesToLocal(projectId, files);
  };

  // 开始新对话
  const startNewConversation = async () => {
    try {
      // 如果存在旧对话，先尝试取消它
      if (conversationId && lastChatId) {
        try {
          console.log('正在取消旧对话:', { conversationId, chatId: lastChatId });
          await cozeService.cancelChat(conversationId, lastChatId);
          console.log('旧对话已取消');
        } catch (error) {
          console.warn('取消旧对话失败，但不影响创建新对话:', error);
          // 不阻止新对话的创建，只是记录警告
        }
      }

      // 清空当前对话状态
      const initialMessage = { role: 'assistant', content: '你好，我是基于Coze智能体的项目AI助手。我正在为您准备项目详情数据，稍后您就可以向我提问项目相关的任何问题。' };
      setMessages([initialMessage]);
      setDisplayMessages([]); // 清空显示消息，重新开始
      setConversationId(null);
      setLastChatId(null);
      setUploadedFiles([]);
      uploadedFilesRef.current = [];
      setProjectDetailsSentToAI(false);
      cozeService.clearAllDataFromLocal(projectId);

      message.success('已开始新对话，文件已清空，旧对话已取消');

      // 重新发送项目详情给AI
      if (projectDetails && projectDetails.markdownContent) {
        await sendProjectDetailsToAI(projectDetails);
      }

      // 如果项目详情已经加载，重新显示欢迎消息
      if (projectDetailsLoaded && projectDetails) {
        const projectSummary = projectDetailsService.generateProjectSummary(projectDetails);
        const welcomeMessage = `你好！我已经为您准备好了项目"${projectDetails.projectName}"的完整详情数据。

项目概况：${projectSummary}

数据包含：${projectDetailsService.formatDataSummary(projectDetails.dataSummary)}

现在您可以向我提问任何关于项目的问题，我会基于项目的实际数据为您提供准确的分析和建议。`;

        setDisplayMessages([{ role: 'assistant', content: welcomeMessage }]);
      }
    } catch (error) {
      console.error('创建新对话失败:', error);
      message.error('创建新对话失败：' + error.message);
    }
  };

  // 从Coze API获取对话历史
  const fetchConversationHistory = async () => {
    if (!conversationId) {
      message.info('当前对话没有连接到Coze服务，无法获取云端历史');
      return;
    }

    setLoadingHistory(true);
    try {
      // 尝试获取对话消息列表
      const historyMessages = await cozeService.getConversationMessages(conversationId);

      if (historyMessages && historyMessages.length > 0) {
        // 转换为我们的消息格式
        const formattedMessages = historyMessages.map(msg => ({
          role: msg.role,
          content: msg.content || msg.text || '消息内容获取失败'
        }));

        // 保存所有消息（包括系统消息）
        setMessages(formattedMessages);

        // 过滤掉系统消息，只显示用户和AI的真实对话
        const userMessages = formattedMessages.filter(msg =>
          !msg.content.includes('[系统消息]') &&
          !msg.content.includes('项目详情数据') &&
          !msg.content.includes('我已经了解了项目详情')
        );
        setDisplayMessages(userMessages);

        saveConversationHistory(formattedMessages, conversationId);
        message.success(`已恢复 ${userMessages.length} 条历史消息`);
      } else {
        message.info('未找到历史消息');
      }
    } catch (error) {
      console.error('获取对话历史失败:', error);
      message.error('获取对话历史失败：' + error.message);
    } finally {
      setLoadingHistory(false);
    }
  };

  // 显示历史记录详情
  const showHistoryDetails = () => {
    setHistoryModalVisible(true);
  };

  // 创建图片缩略图的函数
  const createImageThumbnail = (file) => {
    return new Promise((resolve) => {
      if (!isImageFile(file.name)) {
        resolve(null);
        return;
      }

      try {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = document.createElement('img');
          img.onload = () => {
            try {
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');

              // 设置缩略图尺寸
              const maxSize = 100;
              let { width, height } = img;

              if (width > height) {
                if (width > maxSize) {
                  height = (height * maxSize) / width;
                  width = maxSize;
                }
              } else {
                if (height > maxSize) {
                  width = (width * maxSize) / height;
                  height = maxSize;
                }
              }

              canvas.width = width;
              canvas.height = height;

              ctx.drawImage(img, 0, 0, width, height);
              const thumbnailDataUrl = canvas.toDataURL('image/jpeg', 0.8);
              resolve(thumbnailDataUrl);
            } catch (e) {
              console.warn('Failed to create thumbnail:', e);
              resolve(null);
            }
          };

          img.onerror = () => {
            console.warn('Failed to load image for thumbnail');
            resolve(null);
          };

          img.src = e.target.result;
        };

        reader.onerror = () => {
          console.warn('Failed to read file');
          resolve(null);
        };

        reader.readAsDataURL(file);
      } catch (e) {
        console.warn('Failed to create image thumbnail:', e);
        resolve(null);
      }
    });
  };

  const handleUpload = async ({ file, onSuccess, onError }) => {
    try {
      setUploading(true);

      // 为图片文件创建缩略图
      const thumbnail = await createImageThumbnail(file);

      // 首先尝试使用Coze文件上传
      try {
        const uploadResult = await cozeService.uploadFile(file);

        const fileInfo = {
          id: uploadResult.id,
          name: uploadResult.fileName,
          size: uploadResult.bytes,
          type: file.type,
          uploadedAt: new Date(uploadResult.createdAt * 1000),
          fileName: uploadResult.fileName,
          fileUrl: uploadResult.fileUrl,
          suffixType: uploadResult.suffixType,
          thumbnail: thumbnail // 保存缩略图数据
        };

        setUploadedFiles(prev => {
          const newFiles = [...prev, fileInfo];
          uploadedFilesRef.current = newFiles;
          saveUploadedFiles(newFiles);
          return newFiles;
        });

        onSuccess && onSuccess('ok');
        message.success(`文件 ${file.name} 已上传到AI助手`);
        return;
      } catch (cozeError) {
        console.warn('Coze文件上传失败，尝试后端上传:', cozeError);
      }

      // 如果Coze上传失败，回退到原有的后端接口
      const formData = new FormData();
      formData.append('file', file);
      formData.append('project', projectId);

      try {
        await api.post('/analysis/upload/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        const fileInfo = {
          name: file.name,
          size: file.size,
          type: file.type,
          uploadedAt: new Date(),
          thumbnail: thumbnail // 保存缩略图数据
        };

        setUploadedFiles(prev => {
          const newFiles = [...prev, fileInfo];
          uploadedFilesRef.current = newFiles;
          saveUploadedFiles(newFiles);
          return newFiles;
        });

        onSuccess && onSuccess('ok');
        message.success(`文件 ${file.name} 已上传到项目存储`);
      } catch (e) {
        // 如果后端未实现接口，前端仍记录文件用于上下文
        const fileInfo = {
          name: file.name,
          size: file.size,
          type: file.type,
          uploadedAt: new Date(),
          thumbnail: thumbnail // 保存缩略图数据
        };

        setUploadedFiles(prev => {
          const newFiles = [...prev, fileInfo];
          uploadedFilesRef.current = newFiles;
          saveUploadedFiles(newFiles);
          return newFiles;
        });

        onSuccess && onSuccess('ok');
        message.success(`文件 ${file.name} 已记录（本地模式）`);
      }
    } catch (err) {
      console.error('文件上传失败:', err);
      onError && onError(err);
      message.error('上传失败');
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (fileIndex) => {
    const newFiles = uploadedFiles.filter((_, index) => index !== fileIndex);
    setUploadedFiles(newFiles);
    uploadedFilesRef.current = newFiles;
    saveUploadedFiles(newFiles);
    message.success('文件已移除');
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isImageFile = (fileName) => {
    if (!fileName) return false;
    const extension = fileName.toLowerCase().split('.').pop();
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'ico'];
    return imageExtensions.includes(extension);
  };

  const getFilePreview = (file) => {
    if (isImageFile(file.name)) {
      let imageSrc = null;

      // 优先使用保存的缩略图
      if (file.thumbnail) {
        imageSrc = file.thumbnail;
      }
      // 然后尝试使用 Coze 文件 URL
      else if (file.fileUrl && !file.fileUrl.includes('data:image')) {
        imageSrc = file.fileUrl;
      }

      if (imageSrc) {
        return (
          <Image
            width={50}
            height={50}
            src={imageSrc}
            style={{ objectFit: 'cover', borderRadius: 4 }}
            preview={{
              src: file.fileUrl || imageSrc,
            }}
            fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RnG4W+FmuVYlRSpUsRSCtny..."
            onError={(e) => {
              console.warn('Image preview failed to load:', file.name);
            }}
          />
        );
      }
    }
    return null;
  };

  const sendMessage = async () => {
    const content = input.trim();
    if (!content) return;
    setSending(true);

    // 用户的消息添加到所有消息列表和显示消息列表
    const userMessage = { role: 'user', content };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);

    const newDisplayMessages = [...displayMessages, userMessage];
    setDisplayMessages(newDisplayMessages);
    setInput('');

    // 添加一个空的助手消息用于流式更新
    const assistantMessageIndex = newDisplayMessages.length;
    const displayWithAssistant = [...newDisplayMessages, { role: 'assistant', content: '' }];
    setDisplayMessages(displayWithAssistant);

    try {
      const userId = user?.id?.toString() || user?.username || `user_${Date.now()}`;

      // 获取所有Coze上传的文件信息对象
      const cozeFiles = uploadedFiles.filter(file => file.id);

      console.log('开始调用Coze流式API，用户ID:', userId, '文件数量:', cozeFiles.length);

      // 流式回调函数
      const onMessageCallback = (deltaContent, isCompleted) => {
        if (isCompleted) {
          console.log('流式响应完成');
          return;
        }

        // 实时更新显示的助手消息内容
        setDisplayMessages(prevMessages => {
          const updated = [...prevMessages];
          if (updated[assistantMessageIndex] && updated[assistantMessageIndex].role === 'assistant') {
            updated[assistantMessageIndex] = {
              ...updated[assistantMessageIndex],
              content: updated[assistantMessageIndex].content + deltaContent
            };
          }
          return updated;
        });
      };

      // 直接发送用户消息给Coze API
      const result = await cozeService.chatStream(content, [], userId, cozeFiles, conversationId, onMessageCallback);

      if (result && result.content) {
        // 更新状态
        setConversationId(result.conversationId);
        setLastChatId(result.chatId);

        // 确保最终消息内容正确，同时更新messages和displayMessages
        const assistantMessage = { role: 'assistant', content: result.content };
        const finalMessages = [...newMessages, assistantMessage];
        const finalDisplayMessages = [...newDisplayMessages, assistantMessage];

        setMessages(finalMessages);
        setDisplayMessages(finalDisplayMessages);

        // 保存对话历史（包含所有消息，包括系统消息）
        saveConversationHistory(finalMessages, result.conversationId);

        console.log('Coze流式API调用成功，对话ID:', result.conversationId);
      } else {
        throw new Error('AI返回了空回复');
      }
    } catch (error) {
      console.error('Coze流式API调用失败:', error);

      // 显示具体的错误信息给用户
      let errorMessage = 'AI服务调用失败';
      if (error.message) {
        if (error.message.includes('401') || error.message.includes('unauthorized')) {
          errorMessage = 'API认证失败，请检查Token是否有效';
        } else if (error.message.includes('403') || error.message.includes('forbidden')) {
          errorMessage = 'API权限不足，请检查Bot权限配置';
        } else if (error.message.includes('429') || error.message.includes('rate limit')) {
          errorMessage = 'API调用频率超限，请稍后再试';
        } else if (error.message.includes('400') || error.message.includes('bad request')) {
          errorMessage = 'API请求格式错误，请检查文件格式是否支持';
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = '网络连接错误，请检查网络连接';
        } else {
          errorMessage = `API调用失败: ${error.message}`;
        }
      }

      message.error(errorMessage);

      // 更新助手消息为错误信息
      const errorReply = `抱歉，${errorMessage}。

请检查：
1. 网络连接是否正常
2. Coze API配置是否正确
3. 上传的文件格式是否受支持

详细错误信息请查看浏览器控制台。`;

      setDisplayMessages(prevMessages => {
        const updated = [...prevMessages];
        if (updated[assistantMessageIndex] && updated[assistantMessageIndex].role === 'assistant') {
          updated[assistantMessageIndex] = {
            ...updated[assistantMessageIndex],
            content: errorReply
          };
        }
        return updated;
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ padding: 8 }}>
      <Row gutter={16}>
        <Col span={16}>
          <Card
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Space>
                  <span>AI聊天</span>
                  {loadingProjectDetails && (
                    <Tooltip title="正在加载项目详情数据">
                      <Tag icon={<Spin size="small" />} color="processing" size="small">
                        加载项目数据
                      </Tag>
                    </Tooltip>
                  )}
                  {projectDetailsLoaded && projectDetails && (
                    <Tooltip title={`项目数据已加载：${projectDetailsService.formatDataSummary(projectDetails.dataSummary)}`}>
                      <Tag icon={<DatabaseOutlined />} color="success" size="small">
                        项目数据已就绪
                      </Tag>
                    </Tooltip>
                  )}
                  {projectDetailsError && (
                    <Tooltip title={`项目数据加载失败：${projectDetailsError}`}>
                      <Tag color="error" size="small">
                        数据加载失败
                      </Tag>
                    </Tooltip>
                  )}
                  {conversationId && (
                    <Tooltip title={`对话ID: ${conversationId}`}>
                      <Tag icon={<HistoryOutlined />} color="blue" size="small">
                        历史对话
                      </Tag>
                    </Tooltip>
                  )}
                </Space>
                <Space>
                  {projectDetailsError && (
                    <Tooltip title="重新加载项目数据">
                      <Button
                        type="text"
                        icon={<ReloadOutlined />}
                        size="small"
                        onClick={regenerateProjectDetails}
                        loading={loadingProjectDetails}
                      >
                        重新加载
                      </Button>
                    </Tooltip>
                  )}
                  <Tooltip title="开始新对话">
                    <Button
                      type="text"
                      icon={<PlusOutlined />}
                      size="small"
                      onClick={startNewConversation}
                    >
                      新对话
                    </Button>
                  </Tooltip>
                </Space>
              </div>
            }
            bodyStyle={{ height: 480, display: 'flex', flexDirection: 'column', padding: 0 }}
          >
            <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
              <List
                dataSource={displayMessages}
                renderItem={(m, idx) => (
                  <List.Item key={idx} style={{ border: 'none', padding: '8px 0' }}>
                    <List.Item.Meta
                      avatar={<Avatar icon={m.role === 'assistant' ? <RobotOutlined /> : <UserOutlined />} />}
                      title={
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Text type="secondary">{m.role === 'assistant' ? 'AI助手' : '我'}</Text>
                          {m.role === 'assistant' && m.content === '' && sending && (
                            <Text type="secondary" style={{ fontSize: '12px' }}>正在输入...</Text>
                          )}
                        </div>
                      }
                      description={
                        <div style={{ whiteSpace: 'pre-wrap' }}>
                          {m.content}
                          {m.role === 'assistant' && m.content !== '' && sending && idx === displayMessages.length - 1 && (
                            <span style={{ color: '#1890ff' }}>▍</span>
                          )}
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            </div>
            <div style={{ padding: 12, borderTop: '1px solid #f0f0f0' }}>
              <Space.Compact style={{ width: '100%' }}>
                <TextArea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  autoSize={{ minRows: 1, maxRows: 4 }}
                  placeholder="输入你的问题，按Enter发送"
                  onPressEnter={(e) => { if (!e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                />
                <Button type="primary" icon={<SendOutlined />} loading={sending} onClick={sendMessage}>
                  发送
                </Button>
              </Space.Compact>
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Card title="文件管理" extra={<Text type="secondary">已上传 {uploadedFiles.length} 个文件</Text>}>
            <Upload
              multiple
              accept="*/*"
              customRequest={handleUpload}
              showUploadList={false}
            >
              <Button icon={<UploadOutlined />} loading={uploading} style={{ width: '100%', marginBottom: 12 }}>
                上传文件/图片到AI助手
              </Button>
            </Upload>

            {uploadedFiles.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <Text strong style={{ fontSize: '12px', color: '#666' }}>已上传的文件：</Text>
                <List
                  size="small"
                  dataSource={uploadedFiles}
                  renderItem={(file, index) => (
                    <List.Item
                      key={index}
                      style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}
                      actions={[
                        <Popconfirm
                          title="确定要移除这个文件吗？"
                          onConfirm={() => removeFile(index)}
                          okText="确定"
                          cancelText="取消"
                        >
                          <Button type="text" danger size="small" icon={<DeleteOutlined />} />
                        </Popconfirm>
                      ]}
                    >
                      <List.Item.Meta
                        avatar={getFilePreview(file) || (
                          <Avatar
                            icon={isImageFile(file.name) ? <FileImageOutlined /> : <FileOutlined />}
                            style={{ backgroundColor: isImageFile(file.name) ? '#52c41a' : '#1890ff' }}
                          />
                        )}
                        title={
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Text ellipsis style={{ fontSize: '12px', maxWidth: 120 }}>
                              {file.name}
                            </Text>
                            {file.id && <Tag color="green" size="small">AI可用</Tag>}
                            {isImageFile(file.name) && <Tag color="orange" size="small">图片</Tag>}
                          </div>
                        }
                        description={
                          <Text type="secondary" style={{ fontSize: '11px' }}>
                            {formatFileSize(file.size)}
                          </Text>
                        }
                      />
                    </List.Item>
                  )}
                />
              </div>
            )}

            <div style={{ color: '#8c8c8c', fontSize: '12px' }}>
              <PaperClipOutlined /> 支持文档、图片等格式。上传的文件和图片可用于AI智能分析。
            </div>
          </Card>

          <Card
            title="对话管理"
            style={{ marginTop: 16 }}
            size="small"
          >
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: '12px', color: '#666' }}>消息数量：</Text>
                <Text style={{ fontSize: '12px' }}>{displayMessages.length}</Text>
              </div>

              {conversationId && (
                <>
                  <div style={{ marginTop: 8 }}>
                    <Text style={{ fontSize: '11px', color: '#999' }}>
                      对话ID: {conversationId.slice(-8)}...
                    </Text>
                  </div>

                  <Space style={{ width: '100%', marginTop: 8 }}>
                    <Button
                      type="default"
                      icon={<ReloadOutlined />}
                      size="small"
                      loading={loadingHistory}
                      onClick={fetchConversationHistory}
                      style={{ flex: 1 }}
                    >
                      同步历史
                    </Button>
                    <Button
                      type="default"
                      icon={<HistoryOutlined />}
                      size="small"
                      onClick={showHistoryDetails}
                    >
                      详情
                    </Button>
                  </Space>
                </>
              )}
            </Space>
          </Card>
        </Col>
      </Row>

      {/* 历史记录详情弹窗 */}
      <Modal
        title="对话历史详情"
        open={historyModalVisible}
        onCancel={() => setHistoryModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setHistoryModalVisible(false)}>
            关闭
          </Button>,
          conversationId && (
            <Button
              key="refresh"
              type="primary"
              icon={<ReloadOutlined />}
              loading={loadingHistory}
              onClick={fetchConversationHistory}
            >
              重新获取历史
            </Button>
          )
        ]}
        width={600}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Text strong>对话信息：</Text>
            <div style={{ marginTop: 8, padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
              <div><Text type="secondary">项目ID：</Text>{projectId}</div>
              <div><Text type="secondary">显示消息：</Text>{displayMessages.length}</div>
              <div><Text type="secondary">总消息数：</Text>{messages.length}</div>
              {conversationId && (
                <>
                  <div><Text type="secondary">对话ID：</Text>{conversationId}</div>
                  {lastChatId && <div><Text type="secondary">聊天ID：</Text>{lastChatId}</div>}
                </>
              )}
              <div>
                <Text type="secondary">存储位置：</Text>本地存储 + Coze云端
              </div>
            </div>
          </div>

          <div>
            <Text strong>历史记录操作：</Text>
            <div style={{ marginTop: 8 }}>
              <Text type="secondary">
                可以从Coze服务器重新获取完整的对话历史记录，这将覆盖当前的本地记录。
              </Text>
            </div>
          </div>
        </Space>
      </Modal>
    </div>
  );
};

export default ProjectAIAnalysis;



