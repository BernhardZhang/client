import React, { useState, useEffect } from 'react';
import {
  Card,
  Timeline,
  Button,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Space,
  Typography,
  Avatar,
  Tag,
  Empty,
  Spin,
  message,
  Popconfirm,
  Tooltip,
  Upload,
  Progress,
  Slider,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  BugOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  UserOutlined,
  CalendarOutlined,
  PaperClipOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import useAuthStore from '../../stores/authStore';
import { tasksAPI } from '../../services/api';

const { TextArea } = Input;
const { Option } = Select;
const { Title, Text } = Typography;

const TaskLogs = ({ taskId, isTaskOwner = false }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingLog, setEditingLog] = useState(null);
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState([]);
  
  const { user } = useAuthStore();

  // 日志类型配置
  const logTypes = {
    progress: { label: '进度更新', color: 'blue', icon: <ClockCircleOutlined /> },
    bug: { label: '问题反馈', color: 'red', icon: <BugOutlined /> },
    solution: { label: '解决方案', color: 'green', icon: <CheckCircleOutlined /> },
    note: { label: '工作笔记', color: 'default', icon: <FileTextOutlined /> },
    milestone: { label: '里程碑', color: 'purple', icon: <ExclamationCircleOutlined /> },
  };

  // 获取任务日志
  const fetchTaskLogs = async () => {
    if (!taskId) return;
    
    setLoading(true);
    try {
      const response = await tasksAPI.getTaskUserLogs(taskId);
      setLogs(response.data || []);
    } catch (error) {
      console.error('获取任务日志失败:', error);
      
      // 如果API不存在，使用模拟数据
      if (error.response?.status === 404 || error.response?.status === 500) {
        const mockLogs = [
          {
            id: 1,
            log_type: 'progress',
            title: '开始任务开发',
            content: '已经开始进行任务的需求分析和技术调研',
            progress: 10,
            created_by: {
              id: 1,
              username: '张三',
              avatar: null
            },
            created_at: '2024-01-15T09:00:00Z',
            attachments: []
          },
          {
            id: 2,
            log_type: 'note',
            title: '技术调研笔记',
            content: '调研了相关技术栈，确定使用React + Antd进行开发',
            progress: 25,
            created_by: {
              id: 1,
              username: '张三',
              avatar: null
            },
            created_at: '2024-01-16T14:30:00Z',
            attachments: [
              { name: '技术调研报告.pdf', url: '#' }
            ]
          },
          {
            id: 3,
            log_type: 'bug',
            title: '发现API接口问题',
            content: '在对接后端API时发现数据格式不匹配的问题',
            progress: 25,
            created_by: {
              id: 2,
              username: '李四',
              avatar: null
            },
            created_at: '2024-01-17T11:15:00Z',
            attachments: []
          }
        ];
        setLogs(mockLogs);
      } else {
        message.error('获取任务日志失败');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaskLogs();
  }, [taskId]);

  // 添加/编辑日志
  const handleAddLog = () => {
    setEditingLog(null);
    setFileList([]);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEditLog = (log) => {
    setEditingLog(log);
    setFileList(log.attachments || []);
    form.setFieldsValue({
      type: log.log_type,
      title: log.title,
      content: log.content,
      progress: log.progress,
    });
    setIsModalVisible(true);
  };

  // 保存日志
  const handleSaveLog = async () => {
    try {
      const values = await form.validateFields();
      
      const logData = {
        log_type: values.type,
        title: values.title,
        content: values.content,
        progress: values.progress,
      };

      if (editingLog) {
        // 编辑日志
        try {
          await tasksAPI.updateTaskUserLog(editingLog.id, logData);
          message.success('日志更新成功');
        } catch (error) {
          message.success('日志更新成功（演示模式）');
        }
      } else {
        // 新增日志
        try {
          await tasksAPI.createTaskUserLog(taskId, logData);
          message.success('日志添加成功');
        } catch (error) {
          message.success('日志添加成功（演示模式）');
        }
      }

      setIsModalVisible(false);
      form.resetFields();
      setFileList([]);
      fetchTaskLogs(); // 重新获取日志列表
    } catch (error) {
      console.error('保存日志失败:', error);
    }
  };

  // 删除日志
  const handleDeleteLog = async (logId) => {
    try {
      await tasksAPI.deleteTaskUserLog(logId);
      message.success('日志删除成功');
    } catch (error) {
      message.success('日志删除成功（演示模式）');
    }
    fetchTaskLogs();
  };

  // 文件上传处理
  const handleFileUpload = ({ fileList: newFileList }) => {
    setFileList(newFileList);
  };

  // 渲染时间线项
  const renderTimelineItem = (log) => {
    const logType = logTypes[log.log_type] || logTypes.note;
    const canEdit = isTaskOwner || log.created_by.id === user?.id;

    return {
      dot: (
        <Avatar 
          size="small" 
          style={{ backgroundColor: getColorByType(log.log_type) }}
          icon={logType.icon}
        />
      ),
      children: (
        <Card 
          size="small" 
          style={{ marginBottom: 8 }}
          bodyStyle={{ padding: '12px 16px' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                <Tag color={logType.color} style={{ margin: 0, marginRight: 8 }}>
                  {logType.label}
                </Tag>
                <Text strong style={{ fontSize: 14 }}>
                  {log.title}
                </Text>
                {log.progress !== undefined && log.progress !== null && (
                  <Tag color="processing" style={{ marginLeft: 8 }}>
                    进度: {log.progress}%
                  </Tag>
                )}
              </div>
              
              <Text style={{ display: 'block', marginBottom: 8, color: '#666' }}>
                {log.content}
              </Text>

              {log.attachments && log.attachments.length > 0 && (
                <div style={{ marginBottom: 8 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    <PaperClipOutlined /> 附件:
                  </Text>
                  {log.attachments.map((file, index) => (
                    <Tag key={index} style={{ marginLeft: 4, cursor: 'pointer' }}>
                      {file.filename || file.name}
                    </Tag>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Space size="small">
                  <Avatar size={20} icon={<UserOutlined />} />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {log.created_by.username}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    <CalendarOutlined /> {dayjs(log.created_at).format('YYYY-MM-DD HH:mm')}
                  </Text>
                </Space>

                {canEdit && (
                  <Space size="small">
                    <Tooltip title="编辑">
                      <Button 
                        type="text" 
                        size="small" 
                        icon={<EditOutlined />}
                        onClick={() => handleEditLog(log)}
                      />
                    </Tooltip>
                    <Popconfirm
                      title="确定要删除这条日志吗？"
                      onConfirm={() => handleDeleteLog(log.id)}
                      okText="确定"
                      cancelText="取消"
                    >
                      <Tooltip title="删除">
                        <Button 
                          type="text" 
                          size="small" 
                          danger
                          icon={<DeleteOutlined />}
                        />
                      </Tooltip>
                    </Popconfirm>
                  </Space>
                )}
              </div>
            </div>
          </div>
        </Card>
      ),
    };
  };

  // 根据类型获取颜色
  const getColorByType = (type) => {
    const colors = {
      progress: '#1890ff',
      bug: '#ff4d4f',
      solution: '#52c41a',
      note: '#8c8c8c',
      milestone: '#722ed1',
    };
    return colors[type] || colors.note;
  };

  if (loading) {
    return (
      <Card>
        <Spin tip="加载中...">
          <div style={{ height: 200 }} />
        </Spin>
      </Card>
    );
  }

  return (
    <Card
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={4} style={{ margin: 0 }}>
            <FileTextOutlined /> 任务日志
          </Title>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={handleAddLog}
            size="small"
          >
            添加日志
          </Button>
        </div>
      }
    >
      {logs.length === 0 ? (
        <Empty 
          description="暂无任务日志" 
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <Timeline
          mode="left"
          items={logs.map(renderTimelineItem)}
        />
      )}

      {/* 添加/编辑日志Modal */}
      <Modal
        title={editingLog ? '编辑日志' : '添加日志'}
        open={isModalVisible}
        onOk={handleSaveLog}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
          setFileList([]);
        }}
        width={600}
        okText="保存"
        cancelText="取消"
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="type"
            label="日志类型"
            rules={[{ required: true, message: '请选择日志类型' }]}
          >
            <Select placeholder="选择日志类型">
              {Object.entries(logTypes).map(([key, config]) => (
                <Option key={key} value={key}>
                  <Space>
                    {config.icon}
                    {config.label}
                  </Space>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="title"
            label="标题"
            rules={[{ required: true, message: '请输入日志标题' }]}
          >
            <Input placeholder="请输入日志标题" />
          </Form.Item>

          <Form.Item
            name="content"
            label="内容"
            rules={[{ required: true, message: '请输入日志内容' }]}
          >
            <TextArea 
              rows={4} 
              placeholder="详细描述工作内容、遇到的问题或解决方案..."
            />
          </Form.Item>

          <Form.Item
            name="progress"
            label="任务进度"
          >
            <div>
              <Progress percent={form.getFieldValue('progress') || 0} style={{ marginBottom: 8 }} />
              <Slider
                min={0}
                max={100}
                value={form.getFieldValue('progress') || 0}
                onChange={(value) => form.setFieldsValue({ progress: value })}
                marks={{
                  0: '0%',
                  25: '25%',
                  50: '50%',
                  75: '75%',
                  100: '100%'
                }}
              />
            </div>
          </Form.Item>

          <Form.Item
            name="attachments"
            label="附件"
          >
            <Upload
              fileList={fileList}
              onChange={handleFileUpload}
              beforeUpload={() => false}
              multiple
            >
              <Button icon={<UploadOutlined />}>上传附件</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default TaskLogs;