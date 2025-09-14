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
  BarChartOutlined,
} from '@ant-design/icons';
import { projectsAPI } from '../../services/api';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';
import './ProjectLogs.css';

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
      const response = await projectsAPI.getProjectLogs(projectId, {
        page: pageNum,
        page_size: 20
      });
      
      const newLogs = response.data.results || response.data.logs || [];
      setLogs(reset ? newLogs : [...logs, ...newLogs]);
      setHasMore(response.data.has_more || false);
      setPage(pageNum);
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
      await projectsAPI.createProjectLog(projectId, values);
      message.success('日志创建成功');
      setIsModalVisible(false);
      form.resetFields();
      // 重新加载日志列表
      fetchLogs(1, true);
    } catch (error) {
      console.error('Error creating log:', error);
      message.error('创建日志失败');
    }
  };

  const getLogIcon = (logType) => {
    const iconMap = {
      // 项目相关操作
      'project_created': <PlusOutlined style={{ color: '#52c41a' }} />,
      'project_updated': <EditOutlined style={{ color: '#1890ff' }} />,
      'project_deleted': <DeleteOutlined style={{ color: '#ff4d4f' }} />,
      'project_archived': <FileTextOutlined style={{ color: '#8c8c8c' }} />,
      'project_restored': <FileTextOutlined style={{ color: '#52c41a' }} />,
      
      // 成员管理操作
      'member_joined': <TeamOutlined style={{ color: '#722ed1' }} />,
      'member_left': <TeamOutlined style={{ color: '#ff4d4f' }} />,
      'member_role_changed': <SettingOutlined style={{ color: '#fa8c16' }} />,
      'member_invited': <TeamOutlined style={{ color: '#13c2c2' }} />,
      'member_removed': <DeleteOutlined style={{ color: '#ff7875' }} />,
      'member_permission_changed': <SettingOutlined style={{ color: '#fa8c16' }} />,
      
      // 任务相关操作
      'task_created': <FileTextOutlined style={{ color: '#13c2c2' }} />,
      'task_updated': <EditOutlined style={{ color: '#2f54eb' }} />,
      'task_completed': <CheckCircleOutlined style={{ color: '#52c41a' }} />,
      'task_deleted': <DeleteOutlined style={{ color: '#ff4d4f' }} />,
      'task_assigned': <UserOutlined style={{ color: '#722ed1' }} />,
      'task_reassigned': <UserOutlined style={{ color: '#fa8c16' }} />,
      'task_priority_changed': <ExclamationCircleOutlined style={{ color: '#fa8c16' }} />,
      'task_deadline_changed': <ClockCircleOutlined style={{ color: '#1890ff' }} />,
      'task_progress_updated': <BarChartOutlined style={{ color: '#52c41a' }} />,
      'task_status_changed': <ExclamationCircleOutlined style={{ color: '#ff9c6e' }} />,
      
      // 文件操作
      'file_uploaded': <FileTextOutlined style={{ color: '#fa541c' }} />,
      'file_deleted': <DeleteOutlined style={{ color: '#ff7875' }} />,
      'file_downloaded': <FileTextOutlined style={{ color: '#1890ff' }} />,
      'file_shared': <FileTextOutlined style={{ color: '#52c41a' }} />,
      
      // 评论和沟通
      'comment_added': <FileTextOutlined style={{ color: '#40a9ff' }} />,
      'comment_updated': <EditOutlined style={{ color: '#1890ff' }} />,
      'comment_deleted': <DeleteOutlined style={{ color: '#ff4d4f' }} />,
      'message_sent': <FileTextOutlined style={{ color: '#722ed1' }} />,
      
      // 评分和评估
      'rating_created': <BulbOutlined style={{ color: '#fadb14' }} />,
      'rating_completed': <CheckCircleOutlined style={{ color: '#73d13d' }} />,
      'evaluation_started': <BulbOutlined style={{ color: '#fa8c16' }} />,
      'evaluation_completed': <CheckCircleOutlined style={{ color: '#52c41a' }} />,
      'points_awarded': <BulbOutlined style={{ color: '#fadb14' }} />,
      'points_deducted': <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />,
      
      // 项目状态和里程碑
      'milestone_reached': <BulbOutlined style={{ color: '#ffa940' }} />,
      'milestone_created': <PlusOutlined style={{ color: '#52c41a' }} />,
      'milestone_updated': <EditOutlined style={{ color: '#1890ff' }} />,
      'status_changed': <ExclamationCircleOutlined style={{ color: '#ff9c6e' }} />,
      'progress_updated': <BarChartOutlined style={{ color: '#52c41a' }} />,
      
      // 投票和决策
      'vote_created': <BulbOutlined style={{ color: '#722ed1' }} />,
      'vote_participated': <CheckCircleOutlined style={{ color: '#52c41a' }} />,
      'vote_completed': <CheckCircleOutlined style={{ color: '#73d13d' }} />,
      'decision_made': <BulbOutlined style={{ color: '#fa8c16' }} />,
      
      // 财务相关
      'investment_made': <BulbOutlined style={{ color: '#fadb14' }} />,
      'revenue_recorded': <CheckCircleOutlined style={{ color: '#52c41a' }} />,
      'expense_recorded': <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />,
      'valuation_updated': <BarChartOutlined style={{ color: '#1890ff' }} />,
      
      // 系统操作
      'backup_created': <FileTextOutlined style={{ color: '#8c8c8c' }} />,
      'settings_changed': <SettingOutlined style={{ color: '#fa8c16' }} />,
      'permission_granted': <CheckCircleOutlined style={{ color: '#52c41a' }} />,
      'permission_revoked': <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />,
      
      // 其他操作
      'other': <ClockCircleOutlined style={{ color: '#8c8c8c' }} />,
    };
    
    return iconMap[logType] || iconMap['other'];
  };

  const getLogTypeColor = (logType) => {
    const colorMap = {
      // 项目相关操作
      'project_created': 'success',
      'project_updated': 'processing',
      'project_deleted': 'error',
      'project_archived': 'default',
      'project_restored': 'success',
      
      // 成员管理操作
      'member_joined': 'purple',
      'member_left': 'error',
      'member_role_changed': 'warning',
      'member_invited': 'cyan',
      'member_removed': 'red',
      'member_permission_changed': 'warning',
      
      // 任务相关操作
      'task_created': 'cyan',
      'task_updated': 'geekblue',
      'task_completed': 'success',
      'task_deleted': 'error',
      'task_assigned': 'purple',
      'task_reassigned': 'warning',
      'task_priority_changed': 'warning',
      'task_deadline_changed': 'processing',
      'task_progress_updated': 'success',
      'task_status_changed': 'magenta',
      
      // 文件操作
      'file_uploaded': 'orange',
      'file_deleted': 'red',
      'file_downloaded': 'processing',
      'file_shared': 'success',
      
      // 评论和沟通
      'comment_added': 'blue',
      'comment_updated': 'processing',
      'comment_deleted': 'error',
      'message_sent': 'purple',
      
      // 评分和评估
      'rating_created': 'gold',
      'rating_completed': 'lime',
      'evaluation_started': 'warning',
      'evaluation_completed': 'success',
      'points_awarded': 'gold',
      'points_deducted': 'error',
      
      // 项目状态和里程碑
      'milestone_reached': 'volcano',
      'milestone_created': 'success',
      'milestone_updated': 'processing',
      'status_changed': 'magenta',
      'progress_updated': 'success',
      
      // 投票和决策
      'vote_created': 'purple',
      'vote_participated': 'success',
      'vote_completed': 'lime',
      'decision_made': 'warning',
      
      // 财务相关
      'investment_made': 'gold',
      'revenue_recorded': 'success',
      'expense_recorded': 'error',
      'valuation_updated': 'processing',
      
      // 系统操作
      'backup_created': 'default',
      'settings_changed': 'warning',
      'permission_granted': 'success',
      'permission_revoked': 'error',
      
      // 其他操作
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
        
        {/* 显示操作详细信息 */}
        <div style={{ marginBottom: 8 }}>
          <Space size="small" wrap>
            {log.action_method && (
              <Tag size="small" color="blue">
                方法: {log.action_method}
              </Tag>
            )}
            {log.action_function && (
              <Tag size="small" color="green">
                功能: {log.action_function}
              </Tag>
            )}
            {log.ip_address && (
              <Tag size="small" color="default">
                IP: {log.ip_address}
              </Tag>
            )}
          </Space>
        </div>
        
        {/* 显示相关对象信息 */}
        {(log.related_task_title || log.related_user_name) && (
          <div style={{ marginBottom: 8 }}>
            <Space size="small" wrap>
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
        
        {/* 显示变更信息 */}
        {log.changes && Object.keys(log.changes).length > 0 && (
          <div style={{ marginBottom: 8 }}>
            <Text type="secondary" style={{ fontSize: 11 }}>
              变更内容: {JSON.stringify(log.changes, null, 2)}
            </Text>
          </div>
        )}
        
        {/* 显示元数据 */}
        {log.metadata && Object.keys(log.metadata).length > 0 && (
          <div>
            <Space size="small" wrap>
              {Object.entries(log.metadata).map(([key, value]) => (
                <Tag key={key} size="small" color="default">
                  {key}: {String(value)}
                </Tag>
              ))}
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