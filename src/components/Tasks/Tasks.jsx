import { useEffect, useState } from 'react';
import {
  Row,
  Col,
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
  Popconfirm,
  Tooltip,
  Tabs,
  Select,
  DatePicker,
  Progress,
  Badge,
  Statistic,
  Dropdown,
  Menu,
  Upload,
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
  SettingOutlined,
  MoreOutlined,
  EyeOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  PaperClipOutlined,
  MessageOutlined,
  FlagOutlined,
  ShopOutlined,
} from '@ant-design/icons';
import useAuthStore from '../../stores/authStore';
import useTaskStore from '../../stores/taskStore';
import useProjectStore from '../../stores/projectStore';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const Tasks = () => {
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [taskStats, setTaskStats] = useState({
    total: 0,
    pending: 0,
    in_progress: 0,
    completed: 0,
    overdue: 0
  });
  
  const { user } = useAuthStore();
  const { projects, fetchProjects } = useProjectStore();
  const { 
    tasks, 
    fetchTasks, 
    createTask, 
    updateTask,
    deleteTask,
    isLoading,
    taskStatistics
  } = useTaskStore();

  useEffect(() => {
    if (user) {
      fetchTasks();
      fetchProjects();
      fetchTaskStats();
    }
  }, [user, fetchTasks, fetchProjects]);

  useEffect(() => {
    calculateTaskStats();
  }, [tasks]);

  const fetchTaskStats = async () => {
    const stats = await taskStatistics();
    if (stats) {
      setTaskStats(stats);
    }
  };

  const calculateTaskStats = () => {
    if (!tasks || !Array.isArray(tasks)) return;
    
    const stats = tasks.reduce((acc, task) => {
      acc.total += 1;
      if (task.status === 'pending') acc.pending += 1;
      else if (task.status === 'in_progress') acc.in_progress += 1;
      else if (task.status === 'completed') acc.completed += 1;
      if (task.is_overdue) acc.overdue += 1;
      return acc;
    }, { total: 0, pending: 0, in_progress: 0, completed: 0, overdue: 0 });
    
    setTaskStats(stats);
  };

  const getFilteredTasks = () => {
    if (!tasks || !Array.isArray(tasks)) return [];
    
    let filtered = [...tasks];
    
    // 按标签页过滤
    if (activeTab === 'assigned') {
      filtered = filtered.filter(task => task.assignee === user.id);
    } else if (activeTab === 'created') {
      filtered = filtered.filter(task => task.creator === user.id);
    } else if (activeTab === 'completed') {
      filtered = filtered.filter(task => task.status === 'completed');
    } else if (activeTab === 'overdue') {
      filtered = filtered.filter(task => task.is_overdue);
    }
    
    // 排序
    filtered.sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    return filtered;
  };

  const handleCreateTask = () => {
    setEditingTask(null);
    setIsModalVisible(true);
    form.resetFields();
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setIsModalVisible(true);
    form.setFieldsValue({
      ...task,
      start_date: task.start_date ? dayjs(task.start_date) : null,
      due_date: task.due_date ? dayjs(task.due_date) : null,
    });
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      
      const taskData = {
        ...values,
        start_date: values.start_date ? values.start_date.format('YYYY-MM-DD') : null,
        due_date: values.due_date ? values.due_date.format('YYYY-MM-DD') : null,
      };
      
      let result;
      if (editingTask) {
        result = await updateTask(editingTask.id, taskData);
      } else {
        result = await createTask(taskData);
      }
      
      if (result && result.success !== false) {
        message.success(editingTask ? '任务更新成功！' : '任务创建成功！');
        setIsModalVisible(false);
        form.resetFields();
        fetchTaskStats();
      } else {
        message.error(result?.error || '操作失败');
      }
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    setEditingTask(null);
    form.resetFields();
  };

  const handleDeleteTask = async (taskId) => {
    try {
      const result = await deleteTask(taskId);
      if (result && result.success !== false) {
        message.success('任务删除成功！');
        fetchTaskStats();
      } else {
        message.error(result?.error || '删除失败');
      }
    } catch (error) {
      console.error('删除任务错误:', error);
      message.error('删除任务时发生错误');
    }
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
      title: '项目',
      dataIndex: 'project_name',
      key: 'project_name',
      render: (text) => <Text>{text}</Text>,
    },
    {
      title: '负责人',
      dataIndex: 'assignee_name',
      key: 'assignee_name',
      width: 120,
      render: (text, record) => {
        if (!text) {
          return (
            <Space>
              <Avatar size="small" style={{ backgroundColor: '#f5f5f5' }}>
                <UserOutlined style={{ color: '#d9d9d9' }} />
              </Avatar>
              <Tag color="orange" size="small">未分配</Tag>
            </Space>
          );
        }
        return (
          <Space>
            <Avatar size="small" icon={<UserOutlined />} />
            <Text style={{ fontSize: '13px' }}>{text}</Text>
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
      render: (progress) => (
        <Progress 
          percent={progress} 
          size="small" 
          status={progress === 100 ? 'success' : 'active'}
        />
      ),
    },
    {
      title: '项目大厅',
      dataIndex: 'is_available_for_claim',
      key: 'is_available_for_claim',
      width: 100,
      render: (isAvailable, record) => {
        if (isAvailable && !record.assignee) {
          return <Tag color="green" icon={<ShopOutlined />} size="small">可领取</Tag>;
        } else if (isAvailable && record.assignee) {
          return <Tag color="blue" icon={<ShopOutlined />} size="small">已领取</Tag>;
        }
        return <Tag color="default" size="small">未发布</Tag>;
      },
    },
    {
      title: '截止日期',
      dataIndex: 'due_date',
      key: 'due_date',
      width: 100,
      render: (date, record) => {
        if (!date) return <Text type="secondary">-</Text>;
        const isOverdue = record.is_overdue;
        return (
          <Text type={isOverdue ? 'danger' : 'default'} style={{ fontSize: '12px' }}>
            <CalendarOutlined /> {dayjs(date).format('MM-DD')}
          </Text>
        );
      },
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record) => {
        const canEdit = record.creator === user.id || record.assignee === user.id;
        const canDelete = record.creator === user.id;

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
              message.info('查看详情功能待实现');
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

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>任务管理</Title>
        <Space>
          <Select
            value={`${sortBy}_${sortOrder}`}
            onChange={(value) => {
              const [field, order] = value.split('_');
              setSortBy(field);
              setSortOrder(order);
            }}
            style={{ width: 150 }}
          >
            <Option value="created_at_desc">最新创建</Option>
            <Option value="created_at_asc">最早创建</Option>
            <Option value="due_date_asc">截止时间</Option>
            <Option value="priority_desc">优先级高-低</Option>
            <Option value="progress_desc">进度高-低</Option>
          </Select>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreateTask}
          >
            创建任务
          </Button>
        </Space>
      </Row>

      {/* 统计面板 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总任务"
              value={taskStats.total}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="进行中"
              value={taskStats.in_progress}
              valueStyle={{ color: '#1890ff' }}
              prefix={<BarChartOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已完成"
              value={taskStats.completed}
              valueStyle={{ color: '#3f8600' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="过期任务"
              value={taskStats.overdue}
              valueStyle={{ color: '#cf1322' }}
              prefix={<ExclamationCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <Tabs.TabPane tab="全部任务" key="all" />
          <Tabs.TabPane tab="分配给我" key="assigned" />
          <Tabs.TabPane tab="我创建的" key="created" />
          <Tabs.TabPane tab="已完成" key="completed" />
          <Tabs.TabPane tab="过期任务" key="overdue" />
        </Tabs>

        <Table
          columns={columns}
          dataSource={getFilteredTasks()}
          rowKey="id"
          loading={isLoading}
          scroll={{ x: 1200 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 个任务`,
          }}
        />
      </Card>

      <Modal
        title={editingTask ? '编辑任务' : '创建任务'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        confirmLoading={isLoading}
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
                rules={[{ required: true, message: '请选择项目！' }]}
              >
                <Select placeholder="请选择项目">
                  {projects && projects.map(project => (
                    <Option key={project.id} value={project.id}>
                      {project.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="assignee"
                label="负责人"
              >
                <Select placeholder="请选择负责人" allowClear>
                  {/* 这里需要从项目成员中获取数据 */}
                  <Option value={user.id}>{user.username}</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

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
            name="is_available_for_claim"
            label="发布到项目大厅"
            valuePropName="checked"
            initialValue={false}
          >
            <Switch 
              checkedChildren="是" 
              unCheckedChildren="否"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Tasks;