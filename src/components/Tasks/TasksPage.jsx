import { useEffect, useState, useCallback } from 'react';
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
  Tabs,
  Select,
  DatePicker,
  Progress,
  Badge,
  Statistic,
  Dropdown,
  Slider,
  Rate,
  Popconfirm,
  InputNumber,
  Descriptions,
  Upload,
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
  ExclamationCircleOutlined,
  StarOutlined,
  TeamOutlined,
  TrophyOutlined,
  LineChartOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import useAuthStore from '../../stores/authStore';
import useTaskStore from '../../stores/taskStore';
import useProjectStore from '../../stores/projectStore';
import dayjs from 'dayjs';
import TaskEvaluationModal from './TaskEvaluationModal';
import TaskLogs from './TaskLogs';
import MeritCalculation from './MeritCalculation';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const TasksPage = ({ selectedProjectId = null }) => {
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEvaluationModalVisible, setIsEvaluationModalVisible] = useState(false);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [isMeritCalculationVisible, setIsMeritCalculationVisible] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [evaluatingTask, setEvaluatingTask] = useState(null);
  const [viewingTask, setViewingTask] = useState(null);
  const [meritCalculationTask, setMeritCalculationTask] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedProject, setSelectedProject] = useState(null);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [taskStats, setTaskStats] = useState({
    total: 0,
    pending: 0,
    in_progress: 0,
    completed: 0,
    overdue: 0,
    total_system_score: 0,
    total_function_score: 0
  });
  const [taskFileList, setTaskFileList] = useState([]);
  
  const { user } = useAuthStore();
  const { 
    tasks, 
    fetchTasks, 
    createTask, 
    updateTask,
    deleteTask,
    evaluateTask,
    isLoading 
  } = useTaskStore();
  
  const { projects, fetchProjects } = useProjectStore();

  useEffect(() => {
    fetchTasks();
    fetchProjects();
    // 如果有选中的项目，自动设置项目过滤器
    if (selectedProjectId) {
      setSelectedProject(selectedProjectId);
    }
  }, [selectedProjectId]);

  useEffect(() => {
    calculateTaskStats();
  }, [tasks, selectedProject]);

  const calculateTaskStats = () => {
    if (!tasks || !Array.isArray(tasks)) return;
    
    let filteredTasks = tasks;
    if (selectedProject) {
      filteredTasks = tasks.filter(task => task.project === selectedProject);
    }
    
    const stats = filteredTasks.reduce((acc, task) => {
      acc.total += 1;
      if (task.status === 'pending') acc.pending += 1;
      else if (task.status === 'in_progress') acc.in_progress += 1;
      else if (task.status === 'completed') acc.completed += 1;
      if (task.is_overdue) acc.overdue += 1;
      
      // 统计分数
      acc.total_system_score += Number(task.system_score || 0);
      acc.total_function_score += Number(task.function_score || 0);
      
      return acc;
    }, { 
      total: 0, pending: 0, in_progress: 0, completed: 0, overdue: 0,
      total_system_score: 0, total_function_score: 0
    });
    
    setTaskStats(stats);
  };

  const getFilteredTasks = () => {
    if (!tasks || !Array.isArray(tasks)) return [];
    
    let filtered = [...tasks];
    
    // 按项目过滤
    if (selectedProject) {
      filtered = filtered.filter(task => task.project === selectedProject);
    }
    
    // 按标签页过滤
    if (activeTab === 'assigned') {
      filtered = filtered.filter(task => task.assignee === user.id);
    } else if (activeTab === 'created') {
      filtered = filtered.filter(task => task.creator === user.id);
    } else if (activeTab === 'completed') {
      filtered = filtered.filter(task => task.status === 'completed');
    } else if (activeTab === 'overdue') {
      filtered = filtered.filter(task => task.is_overdue);
    } else if (activeTab === 'evaluatable') {
      // 可评分的任务：已完成且用户参与的任务
      filtered = filtered.filter(task => 
        task.status === 'completed' && 
        (task.assignee === user.id || task.creator === user.id || isUserInTaskTeam(task))
      );
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

  const isUserInTaskTeam = (task) => {
    // 检查用户是否在任务团队中
    return task.team_members?.some(member => member.user_id === user.id);
  };

  const getUserProjects = () => {
    if (!projects || !user) return [];
    return projects.filter(project => 
      project.owner === user.id || 
      project.members_detail?.some(member => member.user === user.id)
    );
  };

  const handleCreateTask = () => {
    setEditingTask(null);
    setIsModalVisible(true);
    form.resetFields();
    setTaskFileList([]);
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setIsModalVisible(true);
    setTaskFileList(task.attachments || []);
    form.setFieldsValue({
      ...task,
      start_date: task.start_date ? dayjs(task.start_date) : null,
      due_date: task.due_date ? dayjs(task.due_date) : null,
    });
  };

  const handleEvaluateTask = (task) => {
    setEvaluatingTask(task);
    setIsEvaluationModalVisible(true);
  };

  const handleMeritCalculation = (task) => {
    setMeritCalculationTask(task);
    setIsMeritCalculationVisible(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      
      // 如果有文件上传，使用FormData，否则使用普通对象
      let taskData;
      if (taskFileList.length > 0) {
        taskData = new FormData();
        
        // 添加基本任务数据
        Object.keys(values).forEach(key => {
          if (key !== 'files') {
            if (key === 'start_date' && values[key]) {
              taskData.append(key, values[key].format('YYYY-MM-DD'));
            } else if (key === 'due_date' && values[key]) {
              taskData.append(key, values[key].format('YYYY-MM-DD'));
            } else {
              taskData.append(key, values[key]);
            }
          }
        });
        
        // 添加文件
        taskFileList.forEach((file, index) => {
          if (file.originFileObj) {
            taskData.append(`files`, file.originFileObj);
          }
        });
      } else {
        taskData = {
          ...values,
          start_date: values.start_date ? values.start_date.format('YYYY-MM-DD') : null,
          due_date: values.due_date ? values.due_date.format('YYYY-MM-DD') : null,
        };
      }
      
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
        setTaskFileList([]);
        fetchTasks();
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
    setTaskFileList([]);
  };

  const handleDeleteTask = async (taskId) => {
    const result = await deleteTask(taskId);
    if (result && result.success !== false) {
      message.success('任务删除成功！');
      fetchTasks();
    } else {
      message.error(result?.error || '删除失败');
    }
  };

  const handleViewTask = (task) => {
    setViewingTask(task);
    setIsDetailModalVisible(true);
  };

  // 任务文件上传处理
  const handleTaskFileUpload = ({ fileList: newFileList }) => {
    // 限制文件大小 (10MB)
    const maxSize = 10 * 1024 * 1024;
    const validFiles = newFileList.filter(file => {
      if (file.size > maxSize) {
        message.error(`文件 ${file.name} 超过10MB限制`);
        return false;
      }
      return true;
    });
    
    setTaskFileList(validFiles);
  };

  // 任务文件上传前的检查
  const beforeTaskUpload = (file) => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain', 'text/csv',
      'application/zip', 'application/x-rar-compressed'
    ];

    if (file.size > maxSize) {
      message.error(`文件 ${file.name} 超过10MB限制`);
      return false;
    }

    if (!allowedTypes.includes(file.type)) {
      message.error(`不支持的文件类型: ${file.type}`);
      return false;
    }

    return false; // 阻止自动上传，手动处理
  };

  const handleEvaluationSubmit = async (evaluationData) => {
    try {
      const result = await evaluateTask(evaluatingTask.id, evaluationData);
      if (result && result.success !== false) {
        message.success('任务评分成功！');
        setIsEvaluationModalVisible(false);
        setEvaluatingTask(null);
        fetchTasks();
      } else {
        message.error(result?.error || '评分失败');
      }
    } catch (error) {
      console.error('评分失败:', error);
      message.error('评分失败');
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
      render: (text, record) => (
        <Space direction="vertical" size="small">
          <Space>
            <Text strong>{text}</Text>
            {record.is_overdue && (
              <Badge status="error" text="过期" />
            )}
          </Space>
          <Text type="secondary" style={{ fontSize: 12 }}>
            项目: {record.project_name}
          </Text>
          {record.description && (
            <Text type="secondary" ellipsis>
              {record.description}
            </Text>
          )}
          {record.tag_list && record.tag_list.length > 0 && (
            <div>
              {record.tag_list.map(tag => (
                <Tag key={tag} size="small">{tag}</Tag>
              ))}
            </div>
          )}
        </Space>
      ),
    },
    {
      title: '负责人',
      dataIndex: 'assignee_name',
      key: 'assignee_name',
      render: (text, record) => (
        <Space>
          <Avatar size="small" icon={<UserOutlined />} />
          {text || '未分配'}
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => getStatusTag(status),
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority) => getPriorityTag(priority),
    },
    {
      title: '进度',
      dataIndex: 'progress',
      key: 'progress',
      render: (progress) => (
        <Progress 
          percent={progress} 
          size="small" 
          status={progress === 100 ? 'success' : 'active'}
        />
      ),
    },
    {
      title: '分数',
      key: 'scores',
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <Text style={{ color: '#1890ff', fontWeight: 'bold' }}>
            系统分: {Number(record.system_score || 0).toFixed(1)}
          </Text>
          <Text style={{ color: '#52c41a', fontWeight: 'bold' }}>
            功分: {Number(record.function_score || 0).toFixed(1)}
          </Text>
          <Text style={{ color: '#722ed1', fontWeight: 'bold' }}>
            总分: {(Number(record.system_score || 0) + Number(record.function_score || 0)).toFixed(1)}
          </Text>
        </Space>
      ),
    },
    {
      title: '截止日期',
      dataIndex: 'due_date',
      key: 'due_date',
      render: (date, record) => {
        if (!date) return '-';
        const isOverdue = record.is_overdue;
        return (
          <Text type={isOverdue ? 'danger' : 'default'}>
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
        const canEvaluate = record.status === 'completed' && 
          (record.assignee === user.id || record.creator === user.id || isUserInTaskTeam(record));

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

        if (canEvaluate) {
          menuItems.push({
            key: 'evaluate',
            icon: <StarOutlined />,
            label: '评分评估',
          });
          menuItems.push({
            key: 'merit',
            icon: <TrophyOutlined />,
            label: '功分计算',
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
            case 'evaluate':
              handleEvaluateTask(record);
              break;
            case 'merit':
              handleMeritCalculation(record);
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
            placeholder="选择项目"
            value={selectedProject}
            onChange={setSelectedProject}
            allowClear
            style={{ width: 200 }}
          >
            {getUserProjects().map(project => (
              <Option key={project.id} value={project.id}>
                {project.name}
              </Option>
            ))}
          </Select>
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
            <Option value="system_score_desc">系统分高-低</Option>
            <Option value="function_score_desc">功分高-低</Option>
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
        <Col span={4}>
          <Card>
            <Statistic
              title="总任务"
              value={taskStats.total}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="进行中"
              value={taskStats.in_progress}
              valueStyle={{ color: '#1890ff' }}
              prefix={<BarChartOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="已完成"
              value={taskStats.completed}
              valueStyle={{ color: '#3f8600' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="过期任务"
              value={taskStats.overdue}
              valueStyle={{ color: '#cf1322' }}
              prefix={<ExclamationCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="总系统分"
              value={taskStats.total_system_score.toFixed(1)}
              valueStyle={{ color: '#1890ff' }}
              prefix={<LineChartOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="总功分"
              value={taskStats.total_function_score.toFixed(1)}
              valueStyle={{ color: '#52c41a' }}
              prefix={<TrophyOutlined />}
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
          <Tabs.TabPane tab="可评分" key="evaluatable" />
        </Tabs>

        <Table
          columns={columns}
          dataSource={getFilteredTasks()}
          rowKey="id"
          loading={isLoading}
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
                rules={[{ required: true, message: '请选择所属项目！' }]}
              >
                <Select placeholder="请选择项目">
                  {getUserProjects().map(project => (
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
                  {/* 这里可以根据选择的项目动态加载成员 */}
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
            <Col span={8}>
              <Form.Item
                name="is_available_for_claim"
                label="开放领取"
                valuePropName="checked"
                tooltip="开启后，其他项目成员可以在项目大厅看到并领取此任务"
              >
                <Switch />
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
            extra="支持图片、PDF、Word、Excel、文本和压缩文件，单文件最大10MB"
          >
            <Upload
              fileList={taskFileList}
              onChange={handleTaskFileUpload}
              beforeUpload={beforeTaskUpload}
              multiple
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.zip,.rar"
              listType="text"
            >
              <Button icon={<UploadOutlined />} disabled={taskFileList.length >= 5}>
                {taskFileList.length >= 5 ? '最多上传5个文件' : '选择文件'}
              </Button>
            </Upload>
            {taskFileList.length > 0 && (
              <div style={{ marginTop: 8, fontSize: '12px', color: '#666' }}>
                已选择 {taskFileList.length} 个文件
              </div>
            )}
          </Form.Item>
        </Form>
      </Modal>

      {/* 任务详情Modal */}
      <Modal
        title={`任务详情 - ${viewingTask?.title}`}
        open={isDetailModalVisible}
        onCancel={() => {
          setIsDetailModalVisible(false);
          setViewingTask(null);
        }}
        footer={null}
        width={1000}
      >
        {viewingTask && (
          <Tabs defaultActiveKey="info">
            <Tabs.TabPane tab="基本信息" key="info">
              <Descriptions column={2} bordered>
                <Descriptions.Item label="任务标题" span={2}>
                  {viewingTask.title}
                </Descriptions.Item>
                <Descriptions.Item label="任务描述" span={2}>
                  {viewingTask.description || '暂无描述'}
                </Descriptions.Item>
                <Descriptions.Item label="状态">
                  {getStatusTag(viewingTask.status)}
                </Descriptions.Item>
                <Descriptions.Item label="优先级">
                  {getPriorityTag(viewingTask.priority)}
                </Descriptions.Item>
                <Descriptions.Item label="进度">
                  <Progress percent={viewingTask.progress || 0} size="small" />
                </Descriptions.Item>
                <Descriptions.Item label="负责人">
                  <Space>
                    <Avatar size="small" icon={<UserOutlined />} />
                    {viewingTask.assignee?.username || '未分配'}
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="创建时间">
                  {dayjs(viewingTask.created_at).format('YYYY-MM-DD HH:mm')}
                </Descriptions.Item>
                <Descriptions.Item label="截止时间">
                  {viewingTask.due_date ? dayjs(viewingTask.due_date).format('YYYY-MM-DD') : '未设置'}
                </Descriptions.Item>
                <Descriptions.Item label="预计工时">
                  {viewingTask.estimated_hours || 0} 小时
                </Descriptions.Item>
                <Descriptions.Item label="实际工时">
                  {viewingTask.actual_hours || 0} 小时
                </Descriptions.Item>
                <Descriptions.Item label="系统评分">
                  <Rate disabled value={viewingTask.system_score || 0} />
                </Descriptions.Item>
                <Descriptions.Item label="功分评分">
                  <Rate disabled value={viewingTask.function_score || 0} />
                </Descriptions.Item>
              </Descriptions>
            </Tabs.TabPane>
            <Tabs.TabPane tab="任务日志" key="logs">
              <TaskLogs 
                taskId={viewingTask.id} 
                isTaskOwner={viewingTask.assignee?.id === user?.id}
              />
            </Tabs.TabPane>
          </Tabs>
        )}
      </Modal>

      {/* 任务评估评分Modal */}
      <TaskEvaluationModal
        visible={isEvaluationModalVisible}
        task={evaluatingTask}
        onCancel={() => {
          setIsEvaluationModalVisible(false);
          setEvaluatingTask(null);
        }}
        onSubmit={handleEvaluationSubmit}
      />

      {/* 功分计算Modal */}
      <MeritCalculation
        taskId={meritCalculationTask?.id}
        visible={isMeritCalculationVisible}
        onClose={() => {
          setIsMeritCalculationVisible(false);
          setMeritCalculationTask(null);
        }}
        taskInfo={meritCalculationTask}
      />
    </div>
  );
};

export default TasksPage;