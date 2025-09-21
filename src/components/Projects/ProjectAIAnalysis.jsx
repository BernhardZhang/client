import React, { useState, useRef, useEffect } from 'react';
import { Card, Row, Col, Input, Button, Upload, List, Avatar, Space, Typography, message, Tag, Popconfirm, Tooltip, Modal } from 'antd';
import { UploadOutlined, SendOutlined, RobotOutlined, UserOutlined, PaperClipOutlined, DeleteOutlined, PlusOutlined, HistoryOutlined, ReloadOutlined } from '@ant-design/icons';
import api from '../../services/api';
import cozeService from '../../services/cozeService';
import useAuthStore from '../../stores/authStore';

const { TextArea } = Input;
const { Text } = Typography;

const ProjectAIAnalysis = ({ projectId, isProjectOwner }) => {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState([
    { role: 'assistant', content: '你好，我是基于Coze智能体的项目AI助手。你可以上传项目相关文件并向我提问，我会结合上下文进行智能分析。' }
  ]);
  const [input, setInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [lastChatId, setLastChatId] = useState(null);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const uploadedFilesRef = useRef([]);

  // 组件加载时恢复对话历史和文件列表
  useEffect(() => {
    const savedConversation = cozeService.loadConversationFromLocal(projectId);
    if (savedConversation && savedConversation.messages && savedConversation.messages.length > 1) {
      setMessages(savedConversation.messages);
      setConversationId(savedConversation.conversationId);
    }

    // 恢复上传的文件列表
    const savedFiles = cozeService.loadUploadedFilesFromLocal(projectId);
    if (savedFiles && savedFiles.length > 0) {
      setUploadedFiles(savedFiles);
      uploadedFilesRef.current = savedFiles;
      console.log(`已恢复 ${savedFiles.length} 个文件`);
    }
  }, [projectId]);

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
  const startNewConversation = () => {
    const initialMessage = { role: 'assistant', content: '你好，我是基于Coze智能体的项目AI助手。你可以上传项目相关文件并向我提问，我会结合上下文进行智能分析。' };
    setMessages([initialMessage]);
    setConversationId(null);
    setLastChatId(null);
    setUploadedFiles([]);
    uploadedFilesRef.current = [];
    cozeService.clearAllDataFromLocal(projectId);
    message.success('已开始新对话，文件已清空');
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

        setMessages(formattedMessages);
        saveConversationHistory(formattedMessages, conversationId);
        message.success(`已恢复 ${formattedMessages.length} 条历史消息`);
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

  const handleUpload = async ({ file, onSuccess, onError }) => {
    try {
      setUploading(true);

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
          suffixType: uploadResult.suffixType
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
          uploadedAt: new Date()
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
          uploadedAt: new Date()
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

  const sendMessage = async () => {
    const content = input.trim();
    if (!content) return;
    setSending(true);
    const newMessages = [...messages, { role: 'user', content }];
    setMessages(newMessages);
    setInput('');

    try {
      const userId = user?.id?.toString() || user?.username || `user_${Date.now()}`;

      // 获取所有Coze上传的文件信息对象
      const cozeFiles = uploadedFiles.filter(file => file.id);

      console.log('开始调用Coze API，用户ID:', userId, '文件数量:', cozeFiles.length);

      const result = await cozeService.chatStream(content, messages, userId, cozeFiles, conversationId);

      if (result && result.content) {
        // 更新状态
        setConversationId(result.conversationId);
        setLastChatId(result.chatId);

        // 构建完整的对话历史
        const finalMessages = [...newMessages, { role: 'assistant', content: result.content }];
        setMessages(finalMessages);

        // 保存对话历史
        saveConversationHistory(finalMessages, result.conversationId);

        console.log('Coze API调用成功，对话ID:', result.conversationId);
      } else {
        throw new Error('AI返回了空回复');
      }
    } catch (error) {
      console.error('Coze API调用失败:', error);

      // 显示具体的错误信息给用户
      let errorMessage = 'AI服务调用失败';
      if (error.message.includes('401')) {
        errorMessage = 'API认证失败，请检查Token是否有效';
      } else if (error.message.includes('403')) {
        errorMessage = 'API权限不足，请检查Bot权限配置';
      } else if (error.message.includes('429')) {
        errorMessage = 'API调用频率超限，请稍后再试';
      } else if (error.message.includes('400')) {
        errorMessage = 'API请求格式错误，请检查文件格式是否支持';
      } else {
        errorMessage = `API调用失败: ${error.message}`;
      }

      message.error(errorMessage);

      // 添加错误信息到对话中
      const errorReply = `抱歉，${errorMessage}。\n\n请检查：\n1. 网络连接是否正常\n2. Coze API配置是否正确\n3. 上传的文件格式是否受支持\n\n详细错误信息请查看浏览器控制台。`;
      const finalMessages = [...newMessages, { role: 'assistant', content: errorReply }];
      setMessages(finalMessages);
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
                  {conversationId && (
                    <Tooltip title={`对话ID: ${conversationId}`}>
                      <Tag icon={<HistoryOutlined />} color="blue" size="small">
                        历史对话
                      </Tag>
                    </Tooltip>
                  )}
                </Space>
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
              </div>
            }
            bodyStyle={{ height: 480, display: 'flex', flexDirection: 'column', padding: 0 }}
          >
            <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
              <List
                dataSource={messages}
                renderItem={(m, idx) => (
                  <List.Item key={idx} style={{ border: 'none', padding: '8px 0' }}>
                    <List.Item.Meta
                      avatar={<Avatar icon={m.role === 'assistant' ? <RobotOutlined /> : <UserOutlined />} />}
                      title={<Text type="secondary">{m.role === 'assistant' ? 'AI助手' : '我'}</Text>}
                      description={<div style={{ whiteSpace: 'pre-wrap' }}>{m.content}</div>}
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
              customRequest={handleUpload}
              showUploadList={false}
            >
              <Button icon={<UploadOutlined />} loading={uploading} style={{ width: '100%', marginBottom: 12 }}>
                上传文件到AI助手
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
                        title={
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Text ellipsis style={{ fontSize: '12px', maxWidth: 120 }}>
                              {file.name}
                            </Text>
                            {file.id && <Tag color="green" size="small">AI可用</Tag>}
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
              <PaperClipOutlined /> 支持文档、图片等格式。上传到AI助手的文件可用于智能分析。
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
                <Text style={{ fontSize: '12px' }}>{messages.length}</Text>
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
              <div><Text type="secondary">消息数量：</Text>{messages.length}</div>
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



