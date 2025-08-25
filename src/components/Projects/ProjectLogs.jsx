import { useState, useEffect } from 'react';
import {
  Card,
  Timeline,
  Avatar, 
  Tag,
  Space,
  Button,
  Spin,
  Empty,
  Modal,
  Form,
  Input,
  Select,
  message,
  Tooltip,
  Typography,
} from 'antd';
import {
  UserOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  SettingOutlined,
  BulbOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

const { Text, Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const ProjectLogs = ({ projectId, showTitle = true, maxHeight = 500 }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    if (projectId) {
      fetchLogs(1, true);
    }
  }, [projectId]);

  const fetchLogs = async (pageNum = 1, reset = false) => {
    if (loading) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/logs/?page=${pageNum}&page_size=20`);
      const data = await response.json();
      
      if (response.ok) {
        const newLogs = data.results || [];
        setLogs(reset ? newLogs : [...logs, ...newLogs]);
        setHasMore(data.has_more || false);
        setPage(pageNum);
      } else {
        message.error(data.error || '获取项目日志失败');
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
      message.error('获取项目日志失败');
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      fetchLogs(page + 1, false);
    }
  };

  const handleCreateLog = async (values) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/logs/create/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        message.success('日志创建成功');
        setIsModalVisible(false);
        form.resetFields();
        // 重新加载日志列表
        fetchLogs(1, true);
      } else {
        message.error(data.error || '创建日志失败');
      }
    } catch (error) {
      console.error('Error creating log:', error);
      message.error('创建日志失败');
    }
  };

  const getLogIcon = (logType) => {
    const iconMap = {
      'project_created': <PlusOutlined style={{ color: '#52c41a' }} />,
      'project_updated': <EditOutlined style={{ color: '#1890ff' }} />,
      'member_joined': <TeamOutlined style={{ color: '#722ed1' }} />,
      'member_left': <TeamOutlined style={{ color: '#ff4d4f' }} />,
      'member_role_changed': <SettingOutlined style={{ color: '#fa8c16' }} />,
      'task_created': <FileTextOutlined style={{ color: '#13c2c2' }} />,
      'task_updated': <EditOutlined style={{ color: '#2f54eb' }} />,
      'task_completed': <CheckCircleOutlined style={{ color: '#52c41a' }} />,
      'task_deleted': <DeleteOutlined style={{ color: '#ff4d4f' }} />,
      'file_uploaded': <FileTextOutlined style={{ color: '#fa541c' }} />,
      'file_deleted': <DeleteOutlined style={{ color: '#ff7875' }} />,
      'rating_created': <BulbOutlined style={{ color: '#fadb14' }} />,
      'rating_completed': <CheckCircleOutlined style={{ color: '#73d13d' }} />,
      'comment_added': <FileTextOutlined style={{ color: '#40a9ff' }} />,
      'milestone_reached': <BulbOutlined style={{ color: '#ffa940' }} />,
      'status_changed': <ExclamationCircleOutlined style={{ color: '#ff9c6e' }} />,
      'other': <ClockCircleOutlined style={{ color: '#8c8c8c' }} />,
    };
    
    return iconMap[logType] || iconMap['other'];
  };

  const getLogTypeColor = (logType) => {
    const colorMap = {
      'project_created': 'success',
      'project_updated': 'processing',
      'member_joined': 'purple',
      'member_left': 'error',
      'member_role_changed': 'warning',
      'task_created': 'cyan',
      'task_updated': 'geekblue',
      'task_completed': 'success',
      'task_deleted': 'error',
      'file_uploaded': 'orange',
      'file_deleted': 'red',
      'rating_created': 'gold',
      'rating_completed': 'lime',
      'comment_added': 'blue',
      'milestone_reached': 'volcano',
      'status_changed': 'magenta',
      'other': 'default',
    };
    
    return colorMap[logType] || 'default';
  };

  const renderLogContent = (log) => {
    return (
      <div>
        <div style={{ marginBottom: 8 }}>
          <Space>
            <Avatar 
              size="small" 
              src={log.user_avatar} 
              icon={<UserOutlined />} 
            />
            <Text strong>{log.user_name}</Text>
            <Tag color={getLogTypeColor(log.log_type)} size="small">
              {log.log_type_display}
            </Tag>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {dayjs(log.created_at).fromNow()}
            </Text>
          </Space>
        </div>
        
        <div style={{ marginBottom: 4 }}>
          <Text>{log.title}</Text>
        </div>
        
        {log.description && (
          <div style={{ marginBottom: 8 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {log.description}
            </Text>
          </div>
        )}
        
        {(log.related_task_title || log.related_user_name) && (
          <div>
            <Space size="small">
              {log.related_task_title && (
                <Tag size="small" color="blue">
                  任务: {log.related_task_title}
                </Tag>
              )}
              {log.related_user_name && (
                <Tag size="small" color="green">
                  用户: {log.related_user_name}
                </Tag>
              )}
            </Space>
          </div>
        )}
      </div>
    );
  };

  const timelineItems = logs.map(log => ({
    key: log.id,
    dot: getLogIcon(log.log_type),
    children: renderLogContent(log),
  }));

  return (
    <div>
      {showTitle && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Title level={4} style={{ margin: 0 }}>项目动态</Title>
          <Button 
            type="primary" 
            size="small" 
            icon={<PlusOutlined />}
            onClick={() => setIsModalVisible(true)}
          >
            添加日志
          </Button>
        </div>
      )}
      
      <Card size="small">
        <div style={{ maxHeight, overflowY: 'auto' }}>
          {logs.length === 0 ? (
            loading ? (
              <div style={{ textAlign: 'center', padding: 20 }}>
                <Spin />
              </div>
            ) : (
              <Empty 
                description="暂无项目动态" 
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )
          ) : (
            <>
              <Timeline items={timelineItems} />
              
              {hasMore && (
                <div style={{ textAlign: 'center', marginTop: 16 }}>
                  <Button 
                    type="link" 
                    loading={loading}
                    onClick={loadMore}
                  >
                    加载更多
                  </Button>
                </div>
              )}
              
              {loading && (
                <div style={{ textAlign: 'center', marginTop: 16 }}>
                  <Spin size="small" />
                </div>
              )}
            </>
          )}
        </div>
      </Card>

      <Modal
        title="添加项目日志"
        open={isModalVisible}
        onOk={() => form.submit()}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        width={520}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateLog}
        >
          <Form.Item
            name="log_type"
            label="日志类型"
            rules={[{ required: true, message: '请选择日志类型' }]}
            initialValue="other"
          >
            <Select>
              <Option value="project_updated">项目更新</Option>
              <Option value="milestone_reached">里程碑达成</Option>
              <Option value="status_changed">状态变更</Option>
              <Option value="other">其他操作</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="title"
            label="日志标题"
            rules={[
              { required: true, message: '请输入日志标题' },
              { max: 200, message: '标题不能超过200个字符' }
            ]}
          >
            <Input placeholder="请输入日志标题" />
          </Form.Item>
          
          <Form.Item
            name="description"
            label="详细描述"
          >
            <TextArea 
              rows={4} 
              placeholder="请输入详细描述（可选）"
              maxLength={1000}
              showCount
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProjectLogs;