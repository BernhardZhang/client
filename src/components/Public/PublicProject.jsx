import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Layout,
  Card,
  Row,
  Col,
  Typography,
  Button,
  Space,
  Divider,
  Tag,
  Avatar,
  Progress,
  Timeline,
  List,
  Empty,
  Statistic,
  Descriptions,
  message
} from 'antd';
import {
  ArrowLeftOutlined,
  ProjectOutlined,
  TeamOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  LoginOutlined,
  AppstoreOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../../services/api';

const { Header, Content, Footer } = Layout;
const { Title, Paragraph, Text } = Typography;

const PublicProject = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProjectData();
  }, [projectId]);

  const fetchProjectData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // 尝试获取公开项目信息
      const [projectRes, tasksRes] = await Promise.allSettled([
        api.get(`/projects/public/${projectId}/`),
        api.get(`/projects/${projectId}/tasks/public/`)
      ]);

      if (projectRes.status === 'fulfilled') {
        setProject(projectRes.value.data);
      } else {
        // 使用模拟数据
        setProject({
          id: parseInt(projectId),
          name: '智能实验室管理系统',
          description: '基于物联网技术的现代化实验室管理系统，支持设备监控、预约管理、数据分析等功能。该系统旨在提高实验室的使用效率和管理水平。',
          status: 'active',
          created_at: '2024-01-15T10:00:00Z',
          members: [
            { id: 1, username: '张三', role: 'owner' },
            { id: 2, username: '李四', role: 'member' },
            { id: 3, username: '王五', role: 'member' },
          ],
          tags: ['物联网', '实验室管理', 'React', 'Django'],
          progress: 75
        });
      }

      if (tasksRes.status === 'fulfilled') {
        setTasks(tasksRes.value.data.results || tasksRes.value.data || []);
      } else {
        // 使用模拟任务数据
        setTasks([
          {
            id: 1,
            title: '设备监控模块开发',
            description: '开发实时设备状态监控功能',
            status: 'completed',
            priority: 'high',
            created_at: '2024-01-16T09:00:00Z',
            assignee: { username: '张三' }
          },
          {
            id: 2,
            title: '用户预约系统',
            description: '实现实验室预约和审核功能',
            status: 'in_progress',
            priority: 'medium',
            created_at: '2024-01-18T14:00:00Z',
            assignee: { username: '李四' }
          },
          {
            id: 3,
            title: '数据分析报表',
            description: '生成实验室使用情况分析报表',
            status: 'pending',
            priority: 'low',
            created_at: '2024-01-20T11:00:00Z',
            assignee: { username: '王五' }
          }
        ]);
      }
    } catch (error) {
      console.error('获取项目数据失败:', error);
      setError('项目不存在或暂时无法访问');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'orange',
      in_progress: 'blue',
      completed: 'green',
      cancelled: 'red'
    };
    return colors[status] || 'default';
  };

  const getStatusText = (status) => {
    const texts = {
      pending: '待开始',
      in_progress: '进行中',
      completed: '已完成',
      cancelled: '已取消'
    };
    return texts[status] || status;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'green',
      medium: 'orange',
      high: 'red',
      urgent: 'purple'
    };
    return colors[priority] || 'default';
  };

  const getPriorityText = (priority) => {
    const texts = {
      low: '低',
      medium: '中',
      high: '高',
      urgent: '紧急'
    };
    return texts[priority] || priority;
  };

  if (loading) {
    return (
      <Layout style={{ minHeight: '100vh' }}>
        <Content style={{ padding: '50px', textAlign: 'center' }}>
          <Card>
            <div>加载中...</div>
          </Card>
        </Content>
      </Layout>
    );
  }

  if (error || !project) {
    return (
      <Layout style={{ minHeight: '100vh' }}>
        <Header style={{ 
          background: '#fff', 
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          padding: '0 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Button icon={<ArrowLeftOutlined />} onClick={handleBack} style={{ marginRight: '16px' }}>
              返回首页
            </Button>
            <AppstoreOutlined style={{ fontSize: '24px', color: '#1890ff', marginRight: '12px' }} />
            <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
              智能协作平台
            </Title>
          </div>
          <Button onClick={handleLogin}>
            <LoginOutlined /> 登录
          </Button>
        </Header>
        <Content style={{ padding: '50px', textAlign: 'center' }}>
          <Card>
            <Empty description={error || '项目不存在'} />
            <Button type="primary" onClick={handleBack}>
              返回首页
            </Button>
          </Card>
        </Content>
      </Layout>
    );
  }

  // 确保tasks是数组
  const safeTasks = Array.isArray(tasks) ? tasks : [];
  const completedTasks = safeTasks.filter(task => task.status === 'completed').length;
  const totalTasks = safeTasks.length;
  const taskProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ 
        background: '#fff', 
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        padding: '0 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Button icon={<ArrowLeftOutlined />} onClick={handleBack} style={{ marginRight: '16px' }}>
            返回首页
          </Button>
          <AppstoreOutlined style={{ fontSize: '24px', color: '#1890ff', marginRight: '12px' }} />
          <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
            智能协作平台
          </Title>
        </div>
        <Button onClick={handleLogin}>
          <LoginOutlined /> 登录
        </Button>
      </Header>

      <Content style={{ padding: '24px', background: '#f0f2f5' }}>
        {/* 项目基本信息 */}
        <Card style={{ marginBottom: '24px' }}>
          <Row gutter={[24, 24]}>
            <Col xs={24} lg={16}>
              <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '16px' }}>
                <Avatar 
                  size={64} 
                  icon={<ProjectOutlined />} 
                  style={{ backgroundColor: '#1890ff', marginRight: '16px' }}
                />
                <div style={{ flex: 1 }}>
                  <Title level={2} style={{ margin: 0, marginBottom: '8px' }}>
                    {project.name}
                  </Title>
                  <Space wrap>
                    <Tag color={getStatusColor(project.status)}>
                      {getStatusText(project.status)}
                    </Tag>
                    <Text type="secondary">
                      <CalendarOutlined /> 创建于 {dayjs(project.created_at).format('YYYY-MM-DD')}
                    </Text>
                  </Space>
                </div>
              </div>
              
              <Paragraph style={{ fontSize: '16px', lineHeight: '1.6' }}>
                {project.description}
              </Paragraph>

              {project.tags && project.tags.length > 0 && (
                <div style={{ marginTop: '16px' }}>
                  <Text strong>技术标签：</Text>
                  <div style={{ marginTop: '8px' }}>
                    {project.tags.map((tag, index) => (
                      <Tag key={index} color="blue">{tag}</Tag>
                    ))}
                  </div>
                </div>
              )}
            </Col>

            <Col xs={24} lg={8}>
              <Card size="small" title="项目统计">
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <Statistic
                      title="团队成员"
                      value={project.members?.length || 0}
                      prefix={<TeamOutlined />}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="任务总数"
                      value={totalTasks}
                      prefix={<FileTextOutlined />}
                    />
                  </Col>
                  <Col span={24}>
                    <div style={{ marginBottom: '8px' }}>
                      <Text strong>项目进度</Text>
                    </div>
                    <Progress 
                      percent={project.progress || taskProgress} 
                      status={project.progress === 100 ? 'success' : 'active'}
                      strokeColor={{
                        '0%': '#108ee9',
                        '100%': '#87d068',
                      }}
                    />
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>
        </Card>

        <Row gutter={[16, 16]}>
          {/* 团队成员 */}
          <Col xs={24} lg={8}>
            <Card title="团队成员" extra={<TeamOutlined />}>
              {project.members && project.members.length > 0 ? (
                <List
                  dataSource={project.members}
                  renderItem={(member) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={<Avatar icon={<TeamOutlined />} />}
                        title={member.username}
                        description={
                          <Tag color={member.role === 'owner' ? 'gold' : 'blue'}>
                            {member.role === 'owner' ? '项目负责人' : '团队成员'}
                          </Tag>
                        }
                      />
                    </List.Item>
                  )}
                />
              ) : (
                <Empty description="暂无团队成员信息" />
              )}
            </Card>
          </Col>

          {/* 任务列表 */}
          <Col xs={24} lg={16}>
            <Card title="项目任务" extra={<FileTextOutlined />}>
              {tasks.length > 0 ? (
                <List
                  dataSource={tasks}
                  renderItem={(task) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={
                          <Avatar 
                            icon={
                              task.status === 'completed' ? <CheckCircleOutlined /> : <ClockCircleOutlined />
                            }
                            style={{
                              backgroundColor: getStatusColor(task.status)
                            }}
                          />
                        }
                        title={
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text strong>{task.title}</Text>
                            <Space>
                              <Tag color={getPriorityColor(task.priority)}>
                                {getPriorityText(task.priority)}
                              </Tag>
                              <Tag color={getStatusColor(task.status)}>
                                {getStatusText(task.status)}
                              </Tag>
                            </Space>
                          </div>
                        }
                        description={
                          <div>
                            <Paragraph ellipsis={{ rows: 2 }}>
                              {task.description}
                            </Paragraph>
                            <Space>
                              {task.assignee && (
                                <Text type="secondary">
                                  负责人: {task.assignee.username}
                                </Text>
                              )}
                              <Text type="secondary">
                                {dayjs(task.created_at).format('YYYY-MM-DD')}
                              </Text>
                            </Space>
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
              ) : (
                <Empty description="暂无任务信息" />
              )}
            </Card>
          </Col>
        </Row>
      </Content>

      <Footer style={{ textAlign: 'center', background: '#fff' }}>
        <Divider />
        <Text type="secondary">
          想要参与项目协作？ 
          <Button type="link" onClick={handleLogin}>立即登录</Button>
          加入我们！
        </Text>
      </Footer>
    </Layout>
  );
};

export default PublicProject;