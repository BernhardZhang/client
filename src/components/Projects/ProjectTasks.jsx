import { useEffect, useState } from 'react';
import {
  Card,
  Button,
  Table,
  Modal,
  Form,
  Input,
  Space,
  Tag,
  Avatar,
  Typography,
  message,
  Select,
  DatePicker,
  Progress,
  Badge,
  Statistic,
  Dropdown,
  Row,
  Col,
  Upload,
  Tabs,
  Slider,
  Switch,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  CalendarOutlined,
  FileTextOutlined,
  BarChartOutlined,
  MoreOutlined,
  EyeOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  UploadOutlined,
  HistoryOutlined,
  ExclamationCircleOutlined,
  ShopOutlined,
} from '@ant-design/icons';
import useAuthStore from '../../stores/authStore';
import { tasksAPI } from '../../services/api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { TabPane } = Tabs;

const ProjectTasks = ({ projectId, project, isProjectOwner }) => {
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [mainActiveTab, setMainActiveTab] = useState('project_tasks'); // 主标签页状态
  const [isTaskDetailVisible, setIsTaskDetailVisible] = useState(false);
  const [viewingTask, setViewingTask] = useState(null);
  const [taskLogs, setTaskLogs] = useState([]);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [taskStats, setTaskStats] = useState({
    total: 0,
    pending: 0,
    in_progress: 0,
    completed: 0,
    overdue: 0
  });
  const [tasks, setTasks] = useState([]);
  const [myTasks, setMyTasks] = useState([]); // 我的任务
  const [loading, setLoading] = useState(false);
  const [claimingTaskId, setClaimingTaskId] = useState(null);
  const [selectedAssignee, setSelectedAssignee] = useState(null); // 选中的负责人
  const [weightCoefficient, setWeightCoefficient] = useState(1.0); // 权重系数
  
  const { user } = useAuthStore();

  useEffect(() => {
    if (projectId) {
      fetchProjectTasks();
      if (mainActiveTab === 'my_tasks') {
        fetchMyTasks();
      }
    }
  }, [projectId, mainActiveTab, user]);

  const fetchProjectTasks = async () => {
    try {
      setLoading(true);
      const response = await tasksAPI.getTasks({ project: projectId });
      const taskList = response.data.results || response.data || [];
      setTasks(taskList);
      
      // 计算统计数据
      const stats = {
        total: taskList.length,
        pending: taskList.filter(t => t.status === 'pending').length,
        in_progress: taskList.filter(t => t.status === 'in_progress').length,
        completed: taskList.filter(t => t.status === 'completed').length,
        overdue: taskList.filter(t => t.is_overdue).length,
      };
      setTaskStats(stats);
    } catch (error) {
      console.error('获取项目任务失败:', error);
      message.error('获取任务列表失败，请刷新页面重试');
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  // 获取我的任务
  const fetchMyTasks = async () => {
    if (!projectId || !user) return;
    
    try {
      setLoading(true);
      const response = await tasksAPI.getTasks({ 
        project: projectId, 
        assignee: user.id
      });
      const taskList = response.data.results || response.data || [];
      setMyTasks(taskList);
    } catch (error) {
      console.error('获取我的任务失败:', error);
      message.error('获取我的任务失败，请稍后重试');
      setMyTasks([]);
    } finally {
      setLoading(false);
    }
  };

  // 领取任务
  const handleClaimTask = async (taskId) => {
    if (!user) {
      message.error('请先登录');
      return;
    }

    setClaimingTaskId(taskId);
    try {
      await tasksAPI.claimTask(taskId);
      message.success('任务领取成功！');
      
      // 记录任务日志
      try {
        await tasksAPI.createTaskUserLog(taskId, {
          action: 'claimed',
          comment: '任务被接受'
        });
      } catch (logError) {
        console.error('记录任务日志失败:', logError);
      }
      
      // 刷新任务列表
      fetchMyTasks();
      fetchProjectTasks();
    } catch (error) {
      console.error('领取任务失败:', error);
      const errorMessage = error.response?.data?.error || '领取任务失败';
      message.error(errorMessage);
    } finally {
      setClaimingTaskId(null);
    }
  };

  const handleCreateTask = () => {
    // 检查用户是否有权限创建任务
    if (!user) {
      message.error('请先登录');
      return;
    }
    
    if (!canCreateTask()) {
      message.error('只有项目成员才能创建任务');
      return;
    }
    
    setEditingTask(null);
    setIsModalVisible(true);
    setSelectedAssignee(null);
    setWeightCoefficient(1.0);
    form.resetFields();
    // 预设项目ID
    form.setFieldsValue({ project: projectId });
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setIsModalVisible(true);
    setSelectedAssignee(task.assignee);
    setWeightCoefficient(task.weight_coefficient || 1.0);
    form.setFieldsValue({
      ...task,
      weight_coefficient: task.weight_coefficient || 1.0,
      start_date: task.start_date ? dayjs(task.start_date) : null,
      due_date: task.due_date ? dayjs(task.due_date) : null,
    });
  };

  const handleViewTask = async (task) => {
    setViewingTask(task);
    setIsTaskDetailVisible(true);
    // 加载任务日志
    await loadTaskLogs(task.id);
  };

  const loadTaskLogs = async (taskId) => {
    try {
      // 调用API获取任务日志
      const response = await tasksAPI.getTaskUserLogs(taskId);
      const logs = response.data.results || response.data || [];
      setTaskLogs(logs);
    } catch (error) {
      console.error('获取任务日志失败:', error);
      message.error('获取任务日志失败');
      setTaskLogs([]);
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      
      // 提取文件列表
      const files = values.files || [];
      const hasFiles = files.length > 0;
      
      setLoading(true);
      try {
        if (editingTask) {
          // 编辑任务
          if (hasFiles) {
            // 如果有新文件，使用FormData
            const formData = new FormData();
            
            // 添加基本字段
            formData.append('title', values.title || '');
            formData.append('description', values.description || '');
            formData.append('priority', values.priority || 'medium');
            formData.append('status', values.status || 'pending');
            formData.append('progress', values.progress || 0);
            formData.append('category', values.category || '');
            formData.append('tags', values.tags || '');
            formData.append('estimated_hours', values.estimated_hours || '');
            
            if (values.assignee) {
              formData.append('assignee', values.assignee);
            }
            if (values.weight_coefficient) {
              formData.append('weight_coefficient', values.weight_coefficient);
            }
            
            if (values.start_date) {
              formData.append('start_date', values.start_date.format('YYYY-MM-DD'));
            }
            
            if (values.due_date) {
              formData.append('due_date', values.due_date.format('YYYY-MM-DD'));
            }
            
            // 添加新文件
            files.forEach((file) => {
              if (file.originFileObj) {
                formData.append('files', file.originFileObj);
              }
            });
            
            await tasksAPI.updateTask(editingTask.id, formData);
          } else {
            // 如果没有新文件，使用JSON格式
            const taskData = {
              title: values.title,
              description: values.description,
              assignee: values.assignee,
              weight_coefficient: values.weight_coefficient,
              priority: values.priority,
              status: values.status,
              progress: values.progress,
              category: values.category,
              tags: values.tags,
              estimated_hours: values.estimated_hours,
              start_date: values.start_date ? values.start_date.format('YYYY-MM-DD') : null,
              due_date: values.due_date ? values.due_date.format('YYYY-MM-DD') : null,
            };
            await tasksAPI.updateTask(editingTask.id, taskData);
          }
          message.success('任务更新成功！');
        } else {
          // 创建任务
          if (hasFiles) {
            // 如果有文件，使用FormData
            const formData = new FormData();
            
            // 添加基本字段
            formData.append('title', values.title || '');
            formData.append('description', values.description || '');
            formData.append('project', projectId);
            formData.append('priority', values.priority || 'medium');
            formData.append('status', values.status || 'pending');
            formData.append('progress', values.progress || 0);
            formData.append('category', values.category || '');
            formData.append('tags', values.tags || '');
            formData.append('estimated_hours', values.estimated_hours || '');
            
            if (values.assignee) {
              formData.append('assignee', values.assignee);
            }
            if (values.weight_coefficient) {
              formData.append('weight_coefficient', values.weight_coefficient);
            }
            
            if (values.start_date) {
              formData.append('start_date', values.start_date.format('YYYY-MM-DD'));
            }
            
            if (values.due_date) {
              formData.append('due_date', values.due_date.format('YYYY-MM-DD'));
            }
            
            // 添加文件
            files.forEach((file) => {
              if (file.originFileObj) {
                formData.append('files', file.originFileObj);
              }
            });
            
            await tasksAPI.createTask(formData);
          } else {
            // 如果没有文件，使用普通的JSON格式
            const taskData = {
              title: values.title,
              description: values.description,
              assignee: values.assignee,
              weight_coefficient: values.weight_coefficient,
              project: projectId,
              priority: values.priority || 'medium',
              status: values.status || 'pending',
              progress: values.progress || 0,
              category: values.category,
              tags: values.tags,
              estimated_hours: values.estimated_hours,
              start_date: values.start_date ? values.start_date.format('YYYY-MM-DD') : null,
              due_date: values.due_date ? values.due_date.format('YYYY-MM-DD') : null,
            };
            await tasksAPI.createTask(taskData);
          }
          message.success('任务创建成功！');
        }
        setIsModalVisible(false);
        form.resetFields();
        fetchProjectTasks();
        
        // 记录任务日志
        try {
          if (editingTask) {
            await tasksAPI.createTaskUserLog(editingTask.id, {
              action: 'updated',
              comment: '任务更新成功'
            });
          } else {
            // 对于新创建的任务，记录创建日志
            // 注意：这里不依赖获取任务ID，因为API可能还没有返回新任务
            console.log('任务创建成功，日志记录将在任务列表刷新后处理');
          }
        } catch (logError) {
          console.error('记录任务日志失败:', logError);
        }
      } catch (error) {
        console.error('任务操作失败:', error);
        message.error(error.response?.data?.message || error.message || '操作失败');
      } finally {
        setLoading(false);
      }
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    setEditingTask(null);
    setSelectedAssignee(null);
    setWeightCoefficient(1.0);
    form.resetFields();
  };

  const handleDeleteTask = async (taskId) => {
    try {
      setLoading(true);
      await tasksAPI.deleteTask(taskId);
      message.success('任务删除成功！');
      fetchProjectTasks();
    } catch (error) {
      console.error('删除任务失败:', error);
      message.error(error.response?.data?.message || '删除失败');
    } finally {
      setLoading(false);
    }
  };

  const isProjectMember = () => {
    if (!project || !user) return false;
    return project.members_detail?.some(member => member.user === user.id) || project.owner === user.id;
  };

  // 检查用户是否可以创建任务（项目成员都可以创建任务）
  const canCreateTask = () => {
    if (!project || !user) return false;
    
    // 项目创建者可以创建任务
    if (project.owner === user.id) return true;
    
    // 项目成员都可以创建任务
    const userMembership = project.members_detail?.find(member => member.user === user.id);
    if (userMembership) return true;
    
    return false;
  };

  const getProjectMembers = () => {
    if (!project) return [];
    
    // 包含项目创建者
    const members = [...(project.members_detail || [])];
    
    // 如果项目创建者不在成员列表中，添加进去
    const ownerExists = members.some(member => member.user === project.owner);
    if (!ownerExists && project.owner_name) {
      members.unshift({
        user: project.owner,
        user_name: project.owner_name,
        role: 'owner'
      });
    }
    
    return members;
  };

  const getStatusTag = (status) => {
    const statusConfig = {
      pending: { color: 'orange', text: '待处理', icon: <ClockCircleOutlined /> },
      in_progress: { color: 'blue', text: '进行中', icon: <BarChartOutlined /> },
      completed: { color: 'green', text: '已完成', icon: <CheckCircleOutlined /> },
      cancelled: { color: 'red', text: '已取消', icon: <ExclamationCircleOutlined /> },
    };
    const config = statusConfig[status] || { color: 'default', text: '未知', icon: null };
    return (
      <Tag color={config.color} icon={config.icon}>
        {config.text}
      </Tag>
    );
  };

  const getPriorityTag = (priority) => {
    const priorityConfig = {
      low: { color: 'default', text: '低' },
      medium: { color: 'blue', text: '中' },
      high: { color: 'orange', text: '高' },
      urgent: { color: 'red', text: '紧急' },
    };
    const config = priorityConfig[priority] || { color: 'default', text: '未知' };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const getFilteredTasks = () => {
    let filtered = [...tasks];
    
    if (activeTab === 'pending') {
      filtered = filtered.filter(task => task.status === 'pending');
    } else if (activeTab === 'in_progress') {
      filtered = filtered.filter(task => task.status === 'in_progress');
    } else if (activeTab === 'completed') {
      filtered = filtered.filter(task => task.status === 'completed');
    } else if (activeTab === 'my_tasks') {
      filtered = filtered.filter(task => task.assignee === user?.id || task.creator === user?.id);
    }
    
    // 排序
    filtered.sort((a, b) => {
      const aValue = a[sortBy] || '';
      const bValue = b[sortBy] || '';
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    return filtered;
  };

  const columns = [
    {
      title: '任务标题',
      dataIndex: 'title',
      key: 'title',
      width: 300,
      render: (text, record) => (
        <Space direction="vertical" size="small" style={{ maxWidth: 280 }}>
          <Space>
            <Text strong style={{ wordBreak: 'break-word' }}>{text}</Text>
            {record.is_overdue && (
              <Badge status="error" text="过期" />
            )}
          </Space>
          {record.description && (
            <Text 
              type="secondary" 
              ellipsis={{ tooltip: record.description }}
              style={{ 
                display: 'block',
                maxWidth: 260,
                fontSize: '12px',
                lineHeight: '16px'
              }}
            >
              {record.description.length > 50 ? 
                `${record.description.substring(0, 50)}...` : 
                record.description
              }
            </Text>
          )}
          {record.tag_list && record.tag_list.length > 0 && (
            <div style={{ marginTop: 4 }}>
              {record.tag_list.slice(0, 3).map(tag => (
                <Tag key={tag} size="small" style={{ marginBottom: 2 }}>
                  {tag}
                </Tag>
              ))}
              {record.tag_list.length > 3 && (
                <Tag size="small" style={{ marginBottom: 2 }}>
                  +{record.tag_list.length - 3}
                </Tag>
              )}
            </div>
          )}
        </Space>
      ),
    },
    {
      title: '负责人',
      dataIndex: 'assignee_name',
      key: 'assignee_name',
      width: 150,
      render: (text, record) => {
        if (!text) {
          return (
            <Space direction="vertical" size={2}>
              <Space>
                <Avatar size="small" style={{ backgroundColor: '#f5f5f5' }}>
                  <UserOutlined style={{ color: '#d9d9d9' }} />
                </Avatar>
                <Tag color="orange" size="small">未分配</Tag>
              </Space>
            </Space>
          );
        }
        return (
          <Space direction="vertical" size={2}>
            <Space>
              <Avatar size="small" icon={<UserOutlined />} />
              <Text style={{ fontSize: '13px' }}>{text}</Text>
            </Space>
            {record.weight_coefficient && (
              <Tag color="blue" size="small">
                权重: {record.weight_coefficient}
              </Tag>
            )}
          </Space>
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => getStatusTag(status),
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 80,
      render: (priority) => getPriorityTag(priority),
    },
    {
      title: '进度',
      dataIndex: 'progress',
      key: 'progress',
      width: 120,
      render: (progress = 0) => (
        <Progress 
          percent={progress} 
          size="small" 
          style={{ width: 80 }}
        />
      ),
    },
    {
      title: '截止日期',
      dataIndex: 'due_date',
      key: 'due_date',
      width: 100,
      render: (date) => {
        if (!date) return <Text type="secondary">-</Text>;
        return (
          <Text style={{ fontSize: '12px' }}>
            {dayjs(date).format('MM-DD')}
          </Text>
        );
      },
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record) => {
        const canEdit = Number(record.creator) === Number(user?.id) || Number(record.assignee) === Number(user?.id) || isProjectOwner;
        const canDelete = Number(record.creator) === Number(user?.id) || isProjectOwner;

        const menuItems = [
          {
            key: 'view',
            icon: <EyeOutlined />,
            label: '查看详情',
          },
        ];

        if (canEdit) {
          menuItems.push({
            key: 'edit',
            icon: <EditOutlined />,
            label: '编辑任务',
          });
        }

        if (canDelete) {
          menuItems.push({
            key: 'delete',
            icon: <DeleteOutlined />,
            label: '删除任务',
            danger: true,
          });
        }

        const handleMenuClick = ({ key }) => {
          switch (key) {
            case 'view':
              handleViewTask(record);
              break;
            case 'edit':
              handleEditTask(record);
              break;
            case 'delete':
              Modal.confirm({
                title: '确定要删除这个任务吗？',
                content: '删除后无法恢复',
                onOk: () => handleDeleteTask(record.id),
              });
              break;
          }
        };

        return (
          <Dropdown
            menu={{ items: menuItems, onClick: handleMenuClick }}
            trigger={['click']}
          >
            <Button type="link" icon={<MoreOutlined />} />
          </Dropdown>
        );
      },
    },
  ];

  // 我的任务的表格列定义
  const myTasksColumns = [
    {
      title: '任务信息',
      key: 'task_info',
      render: (_, record) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
            <Text strong style={{ fontSize: '16px', marginRight: '8px' }}>
              {record.title}
            </Text>
            {getPriorityTag(record.priority)}
          </div>
          <Text 
            type="secondary"
            ellipsis
            style={{ marginBottom: '8px', display: 'block' }}
          >
            {record.description}
          </Text>
          <Space wrap>
            <Text type="secondary">
              <UserOutlined /> {record.creator?.username}
            </Text>
            <Text type="secondary">
              <ClockCircleOutlined /> 预计 {record.estimated_hours || 0} 小时
            </Text>
          </Space>
        </div>
      ),
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      width: 200,
      render: (tags) => (
        <Space wrap>
          {(tags || []).map((tag, index) => (
            <Tag key={index} color="blue">{tag}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: '发布时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 120,
      render: (date) => (
        <Text type="secondary">
          {dayjs(date).format('MM-DD HH:mm')}
        </Text>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button 
            type="text" 
            icon={<EyeOutlined />}
            onClick={() => handleViewTask(record)}
          />
          <Button
            type="primary"
            size="small"
            loading={claimingTaskId === record.id}
            onClick={() => handleClaimTask(record.id)}
            disabled={record.assignee === user?.id}
          >
            {record.assignee === user?.id ? '已接受' : '接受任务'}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '16px 0' }}>
      {/* 主标签页 */}
      <Tabs 
        activeKey={mainActiveTab} 
        onChange={setMainActiveTab}
        type="card"
      >
        <TabPane
          tab={
            <Space>
              <FileTextOutlined />
              项目任务
            </Space>
          }
          key="project_tasks"
        >
          {/* 原有的项目任务管理内容 */}
          <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
            <Space>
              <Select
                value={activeTab}
                onChange={setActiveTab}
                style={{ width: 120 }}
                size="small"
              >
                <Option value="all">全部任务</Option>
                <Option value="pending">待处理</Option>
                <Option value="in_progress">进行中</Option>
                <Option value="completed">已完成</Option>
                <Option value="my_tasks">我的任务</Option>
              </Select>
              <Select
                value={`${sortBy}_${sortOrder}`}
                onChange={(value) => {
                  const [field, order] = value.split('_');
                  setSortBy(field);
                  setSortOrder(order);
                }}
                style={{ width: 120 }}
                size="small"
              >
                <Option value="created_at_desc">最新创建</Option>
                <Option value="due_date_asc">截止时间</Option>
                <Option value="priority_desc">优先级高-低</Option>
                <Option value="progress_desc">进度高-低</Option>
              </Select>
            </Space>
            <Button
              type="primary"
              size="small"
              icon={<PlusOutlined />}
              onClick={handleCreateTask}
              disabled={!canCreateTask()}
            >
              创建任务
            </Button>
          </Row>

          {/* 统计面板 */}
          <Row gutter={8} style={{ marginBottom: 16 }}>
            <Col span={6}>
              <Card size="small" bodyStyle={{ padding: '8px 12px' }}>
                <Statistic
                  title="总任务"
                  value={taskStats.total}
                  prefix={<FileTextOutlined />}
                  valueStyle={{ fontSize: '16px' }}
                  titleStyle={{ fontSize: '12px' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small" bodyStyle={{ padding: '8px 12px' }}>
                <Statistic
                  title="进行中"
                  value={taskStats.in_progress}
                  valueStyle={{ color: '#1890ff', fontSize: '16px' }}
                  titleStyle={{ fontSize: '12px' }}
                  prefix={<BarChartOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small" bodyStyle={{ padding: '8px 12px' }}>
                <Statistic
                  title="已完成"
                  value={taskStats.completed}
                  valueStyle={{ color: '#3f8600', fontSize: '16px' }}
                  titleStyle={{ fontSize: '12px' }}
                  prefix={<CheckCircleOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small" bodyStyle={{ padding: '8px 12px' }}>
                <Statistic
                  title="过期任务"
                  value={taskStats.overdue}
                  valueStyle={{ color: '#cf1322', fontSize: '16px' }}
                  titleStyle={{ fontSize: '12px' }}
                  prefix={<ExclamationCircleOutlined />}
                />
              </Card>
            </Col>
          </Row>

          <div>
            <Table
              columns={columns}
              dataSource={getFilteredTasks()}
              rowKey="id"
              loading={loading}
              size="small"
              pagination={{
                pageSize: 5,
                size: 'small',
                showSizeChanger: false,
                showQuickJumper: false,
                showTotal: (total) => `共 ${total} 个任务`,
              }}
              scroll={{ y: 300, x: 1000 }}
            />
          </div>
        </TabPane>
        
        <TabPane
          tab={
            <Space>
              <UserOutlined />
              我的任务
              <Badge count={myTasks.length} showZero color="#1890ff" />
            </Space>
          }
          key="my_tasks"
        >
          {/* 我的任务内容 */}
          <div style={{ marginBottom: '16px' }}>
            <Text type="secondary">
              这里显示分配给您的任务，您可以查看任务详情、更新进度或接受新任务
            </Text>
          </div>

          {/* 我的任务统计 */}
          <Row gutter={16} style={{ marginBottom: '16px' }}>
            <Col span={8}>
              <Card size="small">
                <Statistic
                  title="我的任务"
                  value={myTasks.length}
                  prefix={<UserOutlined />}
                  valueStyle={{ color: '#3f8600' }}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card size="small">
                <Statistic
                  title="已完成"
                  value={myTasks.filter(task => task.status === 'completed').length}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card size="small">
                <Statistic
                  title="进行中"
                  value={myTasks.filter(task => task.status === 'in_progress').length}
                  prefix={<ClockCircleOutlined />}
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
          </Row>

          {/* 我的任务列表 */}
          <Card>
            <Table
              columns={myTasksColumns}
              dataSource={myTasks}
              loading={loading}
              rowKey="id"
              size="small"
              pagination={{
                pageSize: 5,
                size: 'small',
                showTotal: (total) => `共 ${total} 个我的任务`,
              }}
            />
          </Card>
        </TabPane>
      </Tabs>

      {/* 创建/编辑任务Modal */}
      <Modal
        title={editingTask ? '编辑任务' : '创建任务'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        confirmLoading={loading}
        width={720}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="title"
                label="任务标题"
                rules={[
                  { required: true, message: '请输入任务标题！' },
                  { max: 200, message: '任务标题不能超过200个字符！' },
                ]}
              >
                <Input placeholder="请输入任务标题" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="project"
                label="所属项目"
                initialValue={projectId}
              >
                <Select disabled>
                  <Option value={projectId}>{project?.name}</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="assignee"
                label="负责人"
              >
                <Select 
                  placeholder="请选择负责人" 
                  allowClear
                  onChange={(value) => {
                    setSelectedAssignee(value);
                    // 重置权重系数
                    setWeightCoefficient(1.0);
                    form.setFieldsValue({ weight_coefficient: 1.0 });
                  }}
                >
                  {getProjectMembers().map(member => (
                    <Option key={member.user} value={member.user}>
                      <Space>
                        <span>{member.user_name}</span>
                        {member.role === 'owner' && <Tag color="blue" size="small">创建者</Tag>}
                        {member.role === 'admin' && <Tag color="green" size="small">管理员</Tag>}
                      </Space>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          {/* 权重系数设置 - 只有选择了负责人才显示 */}
          {selectedAssignee && (
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="weight_coefficient"
                  label="项目权重系数"
                  initialValue={1.0}
                  rules={[
                    { required: false, message: '请输入权重系数' },
                    { type: 'number', min: 0.1, max: 1.0, message: '权重系数范围为0.1-1.0' }
                  ]}
                >
                  <Slider
                    min={0.1}
                    max={1.0}
                    step={0.1}
                    marks={{
                      0.1: '0.1',
                      0.3: '0.3',
                      0.5: '0.5',
                      0.7: '0.7',
                      1.0: '1.0'
                    }}
                    value={weightCoefficient}
                    onChange={(value) => {
                      setWeightCoefficient(value);
                      form.setFieldsValue({ weight_coefficient: value });
                    }}
                    tooltip={{
                      formatter: (value) => `${value}`
                    }}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <div style={{ paddingTop: '30px' }}>
                  <Text type="secondary">
                    权重系数: <Text strong style={{ color: '#1890ff' }}>{weightCoefficient}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      用于计算该任务在项目中的重要性权重
                    </Text>
                  </Text>
                </div>
              </Col>
            </Row>
          )}

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="status"
                label="状态"
                initialValue="pending"
              >
                <Select>
                  <Option value="pending">待处理</Option>
                  <Option value="in_progress">进行中</Option>
                  <Option value="completed">已完成</Option>
                  <Option value="cancelled">已取消</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="priority"
                label="优先级"
                initialValue="medium"
              >
                <Select>
                  <Option value="low">低</Option>
                  <Option value="medium">中</Option>
                  <Option value="high">高</Option>
                  <Option value="urgent">紧急</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="category"
                label="分类"
              >
                <Input placeholder="任务分类" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="start_date"
                label="开始日期"
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="due_date"
                label="截止日期"
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="estimated_hours"
                label="预估工时"
              >
                <Input type="number" placeholder="小时" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="progress"
            label="完成进度"
            initialValue={0}
          >
            <Slider
              marks={{
                0: '0%',
                25: '25%',
                50: '50%',
                75: '75%',
                100: '100%'
              }}
            />
          </Form.Item>

          <Form.Item
            name="description"
            label="任务描述"
          >
            <TextArea
              rows={4}
              placeholder="请详细描述任务内容..."
            />
          </Form.Item>

          <Form.Item
            name="tags"
            label="任务标签"
          >
            <Input placeholder="用逗号分隔多个标签" />
          </Form.Item>

          <Form.Item
            name="files"
            label="任务附件"
            valuePropName="fileList"
            getValueFromEvent={(e) => {
              if (Array.isArray(e)) {
                return e;
              }
              return e?.fileList || [];
            }}
          >
            <Upload
              multiple
              beforeUpload={() => false}
              listType="text"
            >
              <Button icon={<UploadOutlined />}>选择文件</Button>
            </Upload>
          </Form.Item>

        </Form>
      </Modal>

      {/* 任务详情Modal */}
      <Modal
        title={`任务详情 - ${viewingTask?.title}`}
        open={isTaskDetailVisible}
        onCancel={() => {
          setIsTaskDetailVisible(false);
          setViewingTask(null);
        }}
        footer={null}
        width={800}
        style={{ top: 20 }}
      >
        {viewingTask && (
          <Tabs defaultActiveKey="info">
            <TabPane tab="基本信息" key="info">
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                <div>
                  <Text strong>任务标题: </Text>
                  <Text>{viewingTask.title}</Text>
                </div>
                <div>
                  <Text strong>任务描述: </Text>
                  <Text>{viewingTask.description || '暂无描述'}</Text>
                </div>
                <div>
                  <Text strong>负责人: </Text>
                  <Space>
                    <Avatar size="small" icon={<UserOutlined />} />
                    {viewingTask.assignee_name || '未分配'}
                  </Space>
                </div>
                {viewingTask.weight_coefficient && (
                  <div>
                    <Text strong>权重系数: </Text>
                    <Tag color="blue">{viewingTask.weight_coefficient}</Tag>
                    <Text type="secondary" style={{ fontSize: '12px', marginLeft: '8px' }}>
                      (项目重要性权重)
                    </Text>
                  </div>
                )}
                <div>
                  <Text strong>状态: </Text>
                  {getStatusTag(viewingTask.status)}
                </div>
                <div>
                  <Text strong>优先级: </Text>
                  {getPriorityTag(viewingTask.priority)}
                </div>
                <div>
                  <Text strong>进度: </Text>
                  <Progress 
                    percent={viewingTask.progress || 0} 
                    size="small" 
                    style={{ width: 200 }} 
                  />
                </div>
                {viewingTask.due_date && (
                  <div>
                    <Text strong>截止日期: </Text>
                    <Text>{dayjs(viewingTask.due_date).format('YYYY-MM-DD')}</Text>
                  </div>
                )}
                {viewingTask.estimated_hours && (
                  <div>
                    <Text strong>预估工时: </Text>
                    <Text>{viewingTask.estimated_hours} 小时</Text>
                  </div>
                )}
                {viewingTask.tag_list && viewingTask.tag_list.length > 0 && (
                  <div>
                    <Text strong>标签: </Text>
                    {viewingTask.tag_list.map(tag => (
                      <Tag key={tag} size="small">{tag}</Tag>
                    ))}
                  </div>
                )}
              </Space>
            </TabPane>

            <TabPane tab="任务日志" key="logs">
              <div style={{ maxHeight: 400, overflow: 'auto' }}>
                {taskLogs.length > 0 ? (
                  <Space direction="vertical" style={{ width: '100%' }} size="middle">
                    {taskLogs.map((log, index) => (
                      <Card key={index} size="small">
                        <Space direction="vertical" size="small">
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Space>
                              <Avatar size="small" icon={<UserOutlined />} />
                              <Text strong>{log.user_name}</Text>
                            </Space>
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              {dayjs(log.created_at).format('YYYY-MM-DD HH:mm')}
                            </Text>
                          </div>
                          <Text>{log.action}</Text>
                          {log.comment && (
                            <Text type="secondary" style={{ fontStyle: 'italic' }}>
                              备注: {log.comment}
                            </Text>
                          )}
                        </Space>
                      </Card>
                    ))}
                  </Space>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <HistoryOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16 }} />
                    <Title level={4} type="secondary">暂无任务日志</Title>
                    <Text type="secondary">任务的操作记录会在这里显示</Text>
                  </div>
                )}
              </div>
            </TabPane>

            <TabPane tab="文件附件" key="files">
              <div style={{ maxHeight: 400, overflow: 'auto' }}>
                {viewingTask.attachments && viewingTask.attachments.length > 0 ? (
                  <Space direction="vertical" style={{ width: '100%' }} size="small">
                    {viewingTask.attachments.map((attachment, index) => (
                      <Card key={index} size="small">
                        <Space>
                          <FileTextOutlined />
                          <Text>{attachment.filename}</Text>
                          <Text type="secondary">({attachment.file_size_display})</Text>
                          <Text type="secondary">
                            {attachment.uploaded_by_name} • {dayjs(attachment.uploaded_at).format('YYYY-MM-DD HH:mm')}
                          </Text>
                        </Space>
                      </Card>
                    ))}
                  </Space>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <FileTextOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16 }} />
                    <Title level={4} type="secondary">暂无文件附件</Title>
                    <Text type="secondary">任务相关的文件会在这里显示</Text>
                  </div>
                )}
              </div>
            </TabPane>
          </Tabs>
        )}
      </Modal>
    </div>
  );
};

export default ProjectTasks;