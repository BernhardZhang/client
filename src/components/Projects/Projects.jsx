import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
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
  Switch,
  Upload,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  TeamOutlined,
  LoginOutlined,
  LogoutOutlined,
  StarOutlined,
  StarFilled,
  CalendarOutlined,
  FileTextOutlined,
  BarChartOutlined,
  SettingOutlined,
  MoreOutlined,
  EyeOutlined,
  ProjectOutlined,
  AppstoreOutlined,
  BarsOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import useAuthStore from '../../stores/authStore';
import useProjectStore from '../../stores/projectStore';
import ProjectLogs from './ProjectLogs';
import MemberRecruitment from './MemberRecruitment';
import ProjectRevenue from './ProjectRevenue';
import Merit from '../Merit/Merit';
import ProjectAnalytics from './ProjectAnalytics';
import ProjectTeamEvaluation from './ProjectTeamEvaluation';
import ProjectTasks from './ProjectTasks';
import ProjectCardGrid from './ProjectCardGrid';
import Voting from '../Voting/Voting';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { TabPane } = Tabs;
const { Option } = Select;

const Projects = ({ onProjectSelect }) => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [viewingProject, setViewingProject] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [sortBy, setSortBy] = useState('create_time');
  const [sortOrder, setSortOrder] = useState('desc');
  const [pinnedProjects, setPinnedProjects] = useState([]);
  const [projectStats, setProjectStats] = useState({ total: 0, active: 0, completed: 0, pending: 0 });
  const [viewMode, setViewMode] = useState('card'); // 'card' 或 'table'
  const [defaultDetailTab, setDefaultDetailTab] = useState('info'); // 默认详情页标签
  const fetchTimeoutRef = useRef(null);
  const lastFetchTimeRef = useRef(0);
  
  const { user, updateProfile } = useAuthStore();
  const { 
    projects, 
    fetchProjects, 
    createProject,
    updateProject,
    deleteProject,
    joinProject, 
    leaveProject, 
    isLoading 
  } = useProjectStore();

  // 防抖的获取项目数据函数
  const debouncedFetchProjects = useCallback(() => {
    const now = Date.now();
    // 防止1秒内多次调用
    if (now - lastFetchTimeRef.current < 1000) {
      return;
    }
    
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }
    
    fetchTimeoutRef.current = setTimeout(() => {
      lastFetchTimeRef.current = Date.now();
      fetchProjects();
    }, 200);
  }, [fetchProjects]);

  useEffect(() => {
    // 组件加载时获取项目数据，避免无限循环
    if (user) {
      debouncedFetchProjects();
    } else {
    }
    
    // 清理函数
    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, []); // 只在组件首次加载时执行

  // 单独的useEffect处理用户信息更新
  useEffect(() => {
    if (user) {
      // 可以在这里处理用户相关的逻辑，但不要调用会更新user的函数
      loadPinnedProjects();
    }
  }, [user?.id]); // 只有用户ID变化时才重新执行

  useEffect(() => {
    calculateProjectStats();
  }, [projects]);

  // 计算项目统计数据
  const calculateProjectStats = () => {
    if (!projects || !Array.isArray(projects)) return;
    
    const stats = projects.reduce((acc, project) => {
      acc.total += 1;
      if (project.status === 'active') acc.active += 1;
      else if (project.status === 'completed') acc.completed += 1;
      else if (project.status === 'pending') acc.pending += 1;
      
      // 计算估值 - 假设从项目数据中获取
      if (project.valuation) {
        acc.totalValuation += Number(project.valuation) || 0;
      }
      
      // 计算融资轮次 - 假设从项目数据中获取
      if (project.funding_rounds) {
        acc.fundingRounds += project.funding_rounds;
      }
      
      return acc;
    }, { 
      total: 0, 
      active: 0, 
      completed: 0, 
      pending: 0, 
      totalValuation: 0, 
      fundingRounds: 0 
    });
    
    setProjectStats(stats);
  };

  // 加载置顶项目
  const loadPinnedProjects = () => {
    const pinned = localStorage.getItem('pinnedProjects');
    if (pinned) {
      setPinnedProjects(JSON.parse(pinned));
    }
  };

  // 切换置顶状态
  const togglePinProject = (projectId) => {
    const newPinned = pinnedProjects.includes(projectId)
      ? pinnedProjects.filter(id => id !== projectId)
      : [...pinnedProjects, projectId];
    
    setPinnedProjects(newPinned);
    localStorage.setItem('pinnedProjects', JSON.stringify(newPinned));
    message.success(pinnedProjects.includes(projectId) ? '取消置顶' : '置顶成功');
  };


  // 获取过滤后的项目
  const getFilteredProjects = () => {
    if (!projects || !Array.isArray(projects)) {
      return [];
    }
    
    
    let filtered = [...projects];
    
    // 按标签页过滤
    if (activeTab === 'created') {
      filtered = filtered.filter(project => isProjectOwner(project));
    } else if (activeTab === 'joined') {
      filtered = filtered.filter(project => isProjectMember(project) && !isProjectOwner(project));
    }
    
    
    // 排序
    filtered.sort((a, b) => {
      // 置顶项目优先
      const aIsPinned = pinnedProjects.includes(a.id);
      const bIsPinned = pinnedProjects.includes(b.id);
      
      if (aIsPinned && !bIsPinned) return -1;
      if (!aIsPinned && bIsPinned) return 1;
      
      // 按选定字段排序
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

  // 删除项目
  const handleDeleteProject = async (projectId) => {
    try {
      const result = await deleteProject(projectId);
      if (result.success) {
        message.success(result.message || '项目删除成功！');
        calculateProjectStats();
      } else {
        message.error(result.error || '删除项目失败');
      }
    } catch (error) {
      console.error('删除项目错误:', error);
      message.error('删除项目时发生错误');
    }
  };

  const handleCreateProject = () => {
    setEditingProject(null);
    setIsModalVisible(true);
    form.resetFields();
  };

  const handleEditProject = (project) => {
    setEditingProject(project);
    setIsModalVisible(true);
    
    // 正确处理日期格式
    const formValues = {
      name: project.name,
      description: project.description,
      project_type: project.project_type,
      status: project.status,
      create_time: project.create_time ? dayjs(project.create_time) : dayjs(),
      tags: project.tags || []
    };
    
    form.setFieldsValue(formValues);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      
      if (editingProject) {
        const result = await updateProject(editingProject.id, values);
        if (result.success) {
          message.success('项目更新成功！');
          setIsModalVisible(false);
          form.resetFields();
          calculateProjectStats();
        } else {
          if (typeof result.error === 'object') {
            Object.values(result.error).flat().forEach(error => {
              message.error(error);
            });
          } else {
            message.error(result.error);
          }
        }
      } else {
        const result = await createProject(values);
        if (result.success) {
          message.success('项目创建成功！');
          setIsModalVisible(false);
          form.resetFields();
          calculateProjectStats(); // 重新计算统计数据
        } else {
          if (typeof result.error === 'object') {
            Object.values(result.error).flat().forEach(error => {
              message.error(error);
            });
          } else {
            message.error(result.error);
          }
        }
      }
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    setEditingProject(null);
    form.resetFields();
  };

  const handleJoinProject = async (projectId) => {
    const result = await joinProject(projectId);
    if (result.success) {
      message.success(result.message || '成功加入项目！');
    } else {
      message.error(result.error || '加入项目失败');
    }
  };

  const handleLeaveProject = async (projectId) => {
    const result = await leaveProject(projectId);
    if (result.success) {
      message.success(result.message || '成功退出项目！');
    } else {
      message.error(result.error || '退出项目失败');
    }
  };

  const isProjectMember = (project) => {
    if (!user || !project.members_detail) return false;
    return project.members_detail.some(member => member.user === user.id);
  };

  const isProjectOwner = (project) => {
    if (!user || !project.owner) return false;
    return project.owner === user.id;
  };

  const handleViewProject = (project) => {
    setViewingProject(project);
    setDefaultDetailTab('info');
    setIsDetailModalVisible(true);
  };

  // 卡片视图的处理函数
  const handleManageTasks = (project) => {
    if (onProjectSelect) {
      onProjectSelect(project);
    }
    setViewingProject(project);
    setDefaultDetailTab('tasks');
    setIsDetailModalVisible(true);
  };

  const handleManageEvaluation = (project) => {
    setViewingProject(project);
    setDefaultDetailTab('evaluation');
    setIsDetailModalVisible(true);
  };

  const handleManageRecruitment = (project) => {
    setViewingProject(project);
    setDefaultDetailTab('recruitment');
    setIsDetailModalVisible(true);
  };

  const handleManageRevenue = (project) => {
    setViewingProject(project);
    setDefaultDetailTab('analytics');
    setIsDetailModalVisible(true);
  };

  // 新增的处理函数
  const handleManageTeam = (project) => {
    setViewingProject(project);
    setDefaultDetailTab('team');
    setIsDetailModalVisible(true);
  };

  const handleManageAnalytics = (project) => {
    setViewingProject(project);
    setDefaultDetailTab('analytics');
    setIsDetailModalVisible(true);
  };

  const handleManageVoting = (project) => {
    setViewingProject(project);
    setDefaultDetailTab('voting');
    setIsDetailModalVisible(true);
  };

  const columns = [
    {
      title: '项目名称',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space direction="vertical" size="small">
          <Space>
            {pinnedProjects.includes(record.id) && (
              <StarFilled style={{ color: '#faad14' }} />
            )}
            <Text strong>{text}</Text>
          </Space>
          <Text type="secondary" ellipsis>
            {record.description}
          </Text>
          {record.tags && record.tags.length > 0 && (
            <div>
              {record.tags.map(tag => (
                <Tag key={tag} size="small" color="blue">{tag}</Tag>
              ))}
            </div>
          )}
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const statusConfig = {
          active: { color: 'success', text: '进行中' },
          completed: { color: 'default', text: '已完成' },
          pending: { color: 'warning', text: '待审核' },
        };
        const config = statusConfig[status] || { color: 'default', text: '未知' };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: '负责人',
      dataIndex: 'owner_name',
      key: 'owner_name',
      render: (text) => (
        <Space>
          <Avatar size="small" icon={<UserOutlined />} />
          {text}
        </Space>
      ),
    },
    {
      title: '成员',
      dataIndex: 'member_count',
      key: 'member_count',
      render: (count, record) => (
        <Space direction="vertical" size="small">
          <Space>
            <TeamOutlined />
            <Text>{count} 人</Text>
          </Space>
          {record.members_detail && record.members_detail.length > 0 && (
            <div>
              {record.members_detail.slice(0, 3).map(member => (
                <Tag key={member.user} size="small">
                  {member.user_name}
                </Tag>
              ))}
              {record.members_detail.length > 3 && (
                <Tag size="small">+{record.members_detail.length - 3}</Tag>
              )}
            </div>
          )}
        </Space>
      ),
    },
    {
      title: '进度',
      dataIndex: 'progress',
      key: 'progress',
      render: (progress = 0, record) => (
        <Space direction="vertical" size="small">
          <Progress 
            percent={progress} 
            size="small" 
            status={progress === 100 ? 'success' : 'active'}
          />
          {record.task_count && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.completed_tasks || 0}/{record.task_count} 任务
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: '项目估值',
      dataIndex: 'valuation',
      key: 'valuation',
      render: (valuation, record) => (
        <Space direction="vertical" size="small">
          <Text strong style={{ color: '#722ed1' }}>
            ¥{Number(valuation || 0).toFixed(2)}
          </Text>
          {record.funding_rounds && (
            <Tag size="small" color="purple">
              第{record.funding_rounds}轮
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: '我的股份',
      key: 'my_equity',
      render: (_, record) => {
        // 计算用户在该项目的股份比例
        const myMembership = record.members_detail?.find(m => m.user === user?.id);
        const equityPercentage = myMembership?.equity_percentage || 0;
        const investmentAmount = myMembership?.investment_amount || 0;
        
        return (
          <Space direction="vertical" size="small">
            <Text strong style={{ color: '#52c41a' }}>
              {Number(equityPercentage || 0).toFixed(2)}%
            </Text>
            {Number(investmentAmount || 0) > 0 && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                投资¥{Number(investmentAmount || 0).toFixed(2)}
              </Text>
            )}
          </Space>
        );
      },
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record) => {
        const isMember = isProjectMember(record);
        const isOwner = isProjectOwner(record);
        const isPinned = pinnedProjects.includes(record.id);

        const menuItems = [
          {
            key: 'view',
            icon: <EyeOutlined />,
            label: '查看详情',
          },
          {
            key: 'pin',
            icon: isPinned ? <StarFilled /> : <StarOutlined />,
            label: isPinned ? '取消置顶' : '置顶项目',
          },
        ];

        if (isOwner) {
          menuItems.push(
            {
              key: 'edit',
              icon: <EditOutlined />,
              label: '编辑项目',
            },
            {
              key: 'manage',
              icon: <SettingOutlined />,
              label: '项目设置',
            },
            {
              type: 'divider',
            },
            {
              key: 'delete',
              icon: <DeleteOutlined />,
              label: '删除项目',
              danger: true,
            }
          );
        }

        const handleMenuClick = ({ key }) => {
          switch (key) {
            case 'view':
              handleViewProject(record);
              break;
            case 'pin':
              togglePinProject(record.id);
              break;
            case 'edit':
              handleEditProject(record);
              break;
            case 'manage':
              message.info('项目设置功能待实现');
              break;
            case 'delete':
              Modal.confirm({
                title: '确定要删除这个项目吗？',
                content: `项目"${record.name}"将被永久删除，此操作不可撤销。`,
                okText: '确定删除',
                okType: 'danger',
                cancelText: '取消',
                onOk: async () => {
                  await handleDeleteProject(record.id);
                },
              });
              break;
          }
        };

        return (
          <Space>
            {!isMember && !isOwner && (
              <Popconfirm
                title="确定要加入这个项目吗？"
                onConfirm={() => handleJoinProject(record.id)}
                okText="确定"
                cancelText="取消"
              >
                <Button
                  type="link"
                  icon={<LoginOutlined />}
                >
                  加入
                </Button>
              </Popconfirm>
            )}
            
            {isMember && !isOwner && (
              <Popconfirm
                title="确定要退出这个项目吗？"
                onConfirm={() => handleLeaveProject(record.id)}
                okText="确定"
                cancelText="取消"
              >
                <Button
                  type="link"
                  danger
                  icon={<LogoutOutlined />}
                >
                  退出
                </Button>
              </Popconfirm>
            )}

            <Dropdown
              menu={{ items: menuItems, onClick: handleMenuClick }}
              trigger={['click']}
            >
              <Button type="link" icon={<MoreOutlined />} />
            </Dropdown>
          </Space>
        );
      },
    },
  ];

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>项目管理</Title>
        <Space>
          <Button.Group>
            <Button
              type={viewMode === 'card' ? 'primary' : 'default'}
              icon={<AppstoreOutlined />}
              onClick={() => setViewMode('card')}
            >
              卡片视图
            </Button>
            <Button
              type={viewMode === 'table' ? 'primary' : 'default'}
              icon={<BarsOutlined />}
              onClick={() => setViewMode('table')}
            >
              列表视图
            </Button>
          </Button.Group>
          <Select
            value={`${sortBy}_${sortOrder}`}
            onChange={(value) => {
              const [field, order] = value.split('_');
              setSortBy(field);
              setSortOrder(order);
            }}
            style={{ width: 150 }}
          >
            <Option value="create_time_desc">最新创建</Option>
            <Option value="create_time_asc">最早创建</Option>
            <Option value="name_asc">名称A-Z</Option>
            <Option value="name_desc">名称Z-A</Option>
            <Option value="progress_desc">进度高-低</Option>
            <Option value="progress_asc">进度低-高</Option>
          </Select>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreateProject}
          >
            创建项目
          </Button>
        </Space>
      </Row>

      {/* 统计面板 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={4}>
          <Card>
            <Statistic
              title="总项目"
              value={projectStats.total}
              prefix={<ProjectOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="进行中"
              value={projectStats.active}
              valueStyle={{ color: '#3f8600' }}
              prefix={<BarChartOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="已完成"
              value={projectStats.completed}
              valueStyle={{ color: '#1890ff' }}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="待审核"
              value={projectStats.pending}
              valueStyle={{ color: '#faad14' }}
              prefix={<CalendarOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="总估值"
              value={projectStats.totalValuation || 0}
              precision={2}
              valueStyle={{ color: '#722ed1' }}
              prefix="¥"
              suffix="元"
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="融资轮次"
              value={projectStats.fundingRounds || 0}
              valueStyle={{ color: '#eb2f96' }}
              suffix="轮"
            />
          </Card>
        </Col>
      </Row>


      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <Tabs.TabPane tab="全部项目" key="all" />
          <Tabs.TabPane tab="我创建的" key="created" />
          <Tabs.TabPane tab="我参与的" key="joined" />
        </Tabs>

        {viewMode === 'card' ? (
          <ProjectCardGrid
            projects={getFilteredProjects()}
            loading={isLoading}
            pinnedProjects={pinnedProjects}
            isProjectOwner={isProjectOwner}
            isProjectMember={isProjectMember}
            onPin={togglePinProject}
            onView={handleViewProject}
            onEdit={handleEditProject}
            onJoin={handleJoinProject}
            onLeave={handleLeaveProject}
            onManageTasks={handleManageTasks}
            onManageEvaluation={handleManageEvaluation}
            onManageRecruitment={handleManageRecruitment}
            onManageRevenue={handleManageRevenue}
            onManageTeam={handleManageTeam}
            onManageAnalytics={handleManageAnalytics}
            onManageVoting={handleManageVoting}
          />
        ) : (
          <Table
            columns={columns}
            dataSource={getFilteredProjects()}
            rowKey="id"
            loading={isLoading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 个项目`,
            }}
          />
        )}
      </Card>

      <Modal
        title={editingProject ? '编辑项目' : '创建项目'}
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
            <Col span={12}>
              <Form.Item
                name="name"
                label="项目名称"
                rules={[
                  { required: true, message: '请输入项目名称！' },
                  { max: 200, message: '项目名称不能超过200个字符！' },
                ]}
              >
                <Input placeholder="请输入项目名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="project_type"
                label="项目类型"
                rules={[{ required: true, message: '请选择项目类型！' }]}
              >
                <Select placeholder="请选择项目类型">
                  <Option value="research">研发项目</Option>
                  <Option value="academic">学术项目</Option>
                  <Option value="design">设计项目</Option>
                  <Option value="innovation">创新实验</Option>
                  <Option value="other">其他</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="status"
                label="项目状态"
                initialValue="active"
              >
                <Select>
                  <Option value="active">进行中</Option>
                  <Option value="pending">待审核</Option>
                  <Option value="completed">已完成</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="create_time"
                label="创建时间"
                initialValue={dayjs()}
              >
                <DatePicker 
                  style={{ width: '100%' }} 
                  showTime
                  format="YYYY-MM-DD HH:mm:ss"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="is_public"
                label="公开展示"
                valuePropName="checked"
                tooltip="开启后，项目信息将在公开页面展示，任何人都可以查看"
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="项目描述"
            rules={[
              { required: true, message: '请输入项目描述！' },
            ]}
          >
            <TextArea
              rows={4}
              placeholder="请详细描述您的项目..."
            />
          </Form.Item>

          <Form.Item
            name="tags"
            label="项目标签"
          >
            <Select
              mode="tags"
              placeholder="输入标签，按回车添加"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            name="files"
            label="项目文件"
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

      {/* 项目详情Modal */}
      <Modal
        title={`项目详情 - ${viewingProject?.name}`}
        open={isDetailModalVisible}
        onCancel={() => {
          setIsDetailModalVisible(false);
          setViewingProject(null);
          setDefaultDetailTab('info');
        }}
        footer={null}
        width={1200}
        style={{ top: 20 }}
      >
        {viewingProject && (
          <Tabs activeKey={defaultDetailTab} onChange={setDefaultDetailTab}>
            <Tabs.TabPane tab="基本信息" key="info">
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Card title="项目概况" size="small">
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <div><Text strong>项目名称：</Text>{viewingProject.name}</div>
                      <div><Text strong>项目描述：</Text>{viewingProject.description || '暂无描述'}</div>
                      <div><Text strong>项目类型：</Text>{viewingProject.project_type || '其他'}</div>
                      <div><Text strong>项目状态：</Text>
                        <Tag color={
                          viewingProject.status === 'active' ? 'success' : 
                          viewingProject.status === 'completed' ? 'default' : 'warning'
                        }>
                          {viewingProject.status === 'active' ? '进行中' : 
                           viewingProject.status === 'completed' ? '已完成' : '待审核'}
                        </Tag>
                      </div>
                      <div><Text strong>项目负责人：</Text>{viewingProject.owner_name}</div>
                      <div><Text strong>成员数量：</Text>{viewingProject.member_count} 人</div>
                      <div><Text strong>项目进度：</Text>
                        <Progress percent={viewingProject.progress || 0} size="small" style={{ width: 200 }} />
                      </div>
                      <div><Text strong>项目估值：</Text>
                        <Text style={{ color: '#722ed1', fontWeight: 'bold' }}>
                          ¥{Number(viewingProject.valuation || 0).toFixed(2)}
                        </Text>
                      </div>
                      <div><Text strong>融资轮次：</Text>
                        {viewingProject.funding_rounds ? (
                          <Tag color="purple">第{viewingProject.funding_rounds}轮</Tag>
                        ) : (
                          <Text type="secondary">暂未融资</Text>
                        )}
                      </div>
                      <div><Text strong>创建时间：</Text>{new Date(viewingProject.created_at).toLocaleString()}</div>
                      {viewingProject.tag_list && viewingProject.tag_list.length > 0 && (
                        <div>
                          <Text strong>项目标签：</Text>
                          <div style={{ marginTop: 4 }}>
                            {viewingProject.tag_list.map(tag => (
                              <Tag key={tag} color="blue" size="small">{tag}</Tag>
                            ))}
                          </div>
                        </div>
                      )}
                    </Space>
                  </Card>
                </Col>
                <Col span={12}>
                  <Card title="项目成员与股份" size="small">
                    {viewingProject.members_detail && viewingProject.members_detail.length > 0 ? (
                      <Space direction="vertical" style={{ width: '100%' }}>
                        {viewingProject.members_detail.map(member => (
                          <div key={member.user} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Space>
                              <Avatar size="small" icon={<UserOutlined />} />
                              <span>{member.user_name}</span>
                            </Space>
                            <Space direction="vertical" size="small" style={{ textAlign: 'right' }}>
                              <Text strong style={{ color: '#52c41a' }}>
                                {Number(member.equity_percentage || 0).toFixed(2)}%
                              </Text>
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                贡献: {member.contribution_percentage || 0}%
                              </Text>
                              {Number(member.investment_amount || 0) > 0 && (
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                  投资: ¥{Number(member.investment_amount || 0).toFixed(2)}
                                </Text>
                              )}
                            </Space>
                          </div>
                        ))}
                      </Space>
                    ) : (
                      <Text type="secondary">暂无成员信息</Text>
                    )}
                  </Card>
                  
                  {/* 在基本信息页面添加项目动态 */}
                  <Card title="最近动态" size="small" style={{ marginTop: 16 }}>
                    <ProjectLogs projectId={viewingProject.id} showTitle={false} maxHeight={200} />
                  </Card>
                </Col>
              </Row>
            </Tabs.TabPane>
            
            <Tabs.TabPane tab="任务管理" key="tasks">
              <ProjectTasks 
                projectId={viewingProject.id} 
                project={viewingProject} 
                isProjectOwner={isProjectOwner(viewingProject)}
              />
            </Tabs.TabPane>
            
            <Tabs.TabPane tab="团队管理" key="team">
              {/* 合并功分系统、团队评估、成员招募 */}
              <Tabs defaultActiveKey="merit" type="card">
                <Tabs.TabPane tab="功分系统" key="merit">
                  <Merit projectId={viewingProject.id} />
                </Tabs.TabPane>
                <Tabs.TabPane tab="团队评估" key="evaluation">
                  <ProjectTeamEvaluation
                    projectId={viewingProject.id} 
                    project={viewingProject} 
                    isProjectOwner={isProjectOwner(viewingProject)} 
                  />
                </Tabs.TabPane>
                <Tabs.TabPane tab="成员招募" key="recruitment">
                  <MemberRecruitment projectId={viewingProject.id} isProjectOwner={isProjectOwner(viewingProject)} />
                </Tabs.TabPane>
              </Tabs>
            </Tabs.TabPane>
            
            <Tabs.TabPane tab="数据分析" key="analytics">
              {/* 合并数据分析和收益管理 */}
              <Tabs defaultActiveKey="data" type="card">
                <Tabs.TabPane tab="项目分析" key="data">
                  <ProjectAnalytics
                    projectId={viewingProject.id} 
                    project={viewingProject} 
                    isProjectOwner={isProjectOwner(viewingProject)} 
                  />
                </Tabs.TabPane>
                <Tabs.TabPane tab="收益管理" key="revenue">
                  <ProjectRevenue projectId={viewingProject.id} isProjectOwner={isProjectOwner(viewingProject)} />
                </Tabs.TabPane>
              </Tabs>
            </Tabs.TabPane>
            
            <Tabs.TabPane tab="项目投票" key="voting">
              <Voting projectId={viewingProject.id} />
            </Tabs.TabPane>
          </Tabs>
        )}
      </Modal>
    </div>
  );
};

export default Projects;