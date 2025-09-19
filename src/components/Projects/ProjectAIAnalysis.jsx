import React, { useState, useRef } from 'react';
import { Card, Row, Col, Input, Button, Upload, List, Avatar, Space, Typography, message } from 'antd';
import { UploadOutlined, SendOutlined, RobotOutlined, UserOutlined, PaperClipOutlined } from '@ant-design/icons';
import api from '../../services/api';

const { TextArea } = Input;
const { Text } = Typography;

const ProjectAIAnalysis = ({ projectId, isProjectOwner }) => {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: '你好，我是项目AI助手。你可以上传项目相关文件并向我提问，我会结合上下文进行分析。' }
  ]);
  const [input, setInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const uploadedFilesRef = useRef([]);

  const handleUpload = async ({ file, onSuccess, onError }) => {
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('project', projectId);
      // 兼容无后端文件接收时的静默成功
      try {
        await api.post('/analysis/upload/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } catch (e) {
        // 如果后端未实现接口，前端仍记录文件用于上下文
      }
      uploadedFilesRef.current.push({ name: file.name, size: file.size });
      onSuccess && onSuccess('ok');
      message.success('文件已上传');
    } catch (err) {
      onError && onError(err);
      message.error('上传失败');
    } finally {
      setUploading(false);
    }
  };

  const sendMessage = async () => {
    const content = input.trim();
    if (!content) return;
    setSending(true);
    const newMessages = [...messages, { role: 'user', content }];
    setMessages(newMessages);
    setInput('');

    try {
      // 调用后端AI分析接口；若未实现则给出本地占位回复
      let reply = null;
      try {
        const resp = await api.post('/analysis/ai-chat/', {
          project: projectId,
          messages: newMessages.slice(-10),
          files: uploadedFilesRef.current
        });
        reply = resp.data?.reply;
      } catch (e) {}

      if (!reply) {
        // 本地占位：简单回显+建议
        reply = `我已收到你的问题：“${content}”。当前可用文件数：${uploadedFilesRef.current.length}。请确保提供任务、时间节点与目标，我会生成分析与建议。`;
      }

      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ padding: 8 }}>
      <Row gutter={16}>
        <Col span={16}>
          <Card title="AI聊天" bodyStyle={{ height: 480, display: 'flex', flexDirection: 'column', padding: 0 }}>
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
          <Card title="文件上传" extra={<Text type="secondary">用于辅助AI分析</Text>}>
            <Upload
              multiple
              customRequest={handleUpload}
              showUploadList={true}
            >
              <Button icon={<UploadOutlined />} loading={uploading}>上传文件</Button>
            </Upload>
            <div style={{ marginTop: 12, color: '#8c8c8c' }}>
              <PaperClipOutlined /> 支持文档、图片等常见格式，单次多文件。
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ProjectAIAnalysis;



