import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Typography, 
  Button, 
  Space,
  List,
  Tag,
  Avatar,
  Timeline,
  Empty
} from 'antd';
import {
  UserOutlined,
  ProjectOutlined,
  CheckCircleOutlined,
  CalendarOutlined,
  TeamOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const { Title, Paragraph, Text } = Typography;

const PublicHome = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProjects: 0,
    completedTasks: 0,
    totalTasks: 0
  });
  const [recentProjects, setRecentProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // 获取公开统计数据
  const fetchPublicStats = async () => {
    setLoading(true);
    try {
      // 获取公开的统计信息
      const [projectsRes] = await Promise.allSettled([
        api.get('/projects/public-stats/'),
      ]);

      if (projectsRes.status === 'fulfilled') {
        setStats(projectsRes.value.data);
      }

      // 获取公开项目列表（前5个）
      const publicProjectsRes = await api.get('/projects/public/', { params: { limit: 5 } });
      if (publicProjectsRes.data) {
        setRecentProjects(publicProjectsRes.data.results || publicProjectsRes.data);
      }
    } catch (error) {
      console.error('获取公开数据失败:', error);
      // 使用模拟数据
      setStats({
        totalUsers: 25,
        totalProjects: 8,
        completedTasks: 156,
        totalTasks: 203
      });
      setRecentProjects([
        {
          id: 1,
          name: '智能实验室管理系统',
          description: '基于物联网的实验室设备管理和预约系统',
          status: 'active',
          members_count: 6,
          created_at: '2024-01-15T10:00:00Z'
        },
        {
          id: 2,
          name: '学生成绩分析平台',
          description: '数据驱动的学生学习效果分析和预警系统',
          status: 'active',
          members_count: 4,
          created_at: '2024-01-10T15:30:00Z'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublicStats();
  }, []);

  const handleViewProject = (projectId) => {
    navigate(`/public/projects/${projectId}`);
  };

  return (
    <div style={{ padding: '24px', background: '#f0f2f5' }}>
      {/* 欢迎区域 */}
      <Card style={{ marginBottom: '24px', textAlign: 'center' }}>
        <Title level={2}>欢迎来到功分易</Title>
        <Paragraph style={{ fontSize: '16px', color: '#666', maxWidth: '600px', margin: '0 auto' }}>
          功分易是一个现代化的项目管理和团队协作平台，支持任务管理、功劳评估、财务管理等功能。
          我们致力于提高团队协作效率，让每个项目都能高效推进，公平分配功劳。
        </Paragraph>
      </Card>

      {/* 统计数据 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="注册用户"
              value={stats.totalUsers}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="活跃项目"
              value={stats.totalProjects}
              prefix={<ProjectOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="已完成任务"
              value={stats.completedTasks}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="总任务数"
              value={stats.totalTasks}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {/* 最近项目 */}
        <Col xs={24} lg={12}>
          <Card title="最近项目" extra={<ProjectOutlined />}>
            {recentProjects.length > 0 ? (
              <List
                dataSource={recentProjects}
                renderItem={(project) => (
                  <List.Item
                    actions={[
                      <Button 
                        type="link" 
                        onClick={() => handleViewProject(project.id)}
                      >
                        查看详情
                      </Button>
                    ]}
                  >
                    <List.Item.Meta
                      avatar={<Avatar icon={<ProjectOutlined />} />}
                      title={project.name}
                      description={
                        <div>
                          <Paragraph ellipsis={{ rows: 2 }}>
                            {project.description}
                          </Paragraph>
                          <Space>
                            <Tag color="blue">
                              <TeamOutlined /> {project.members_count || 0} 成员
                            </Tag>
                            <Tag color={project.status === 'active' ? 'green' : 'orange'}>
                              {project.status === 'active' ? '进行中' : '已完成'}
                            </Tag>
                          </Space>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="暂无公开项目" />
            )}
          </Card>
        </Col>

        {/* 平台特色 */}
        <Col xs={24} lg={12}>
          <Card title="平台特色" extra={<TrophyOutlined />}>
            <Timeline>
              <Timeline.Item color="blue">
                <Text strong>项目管理</Text>
                <br />
                <Text type="secondary">完整的项目生命周期管理，支持任务分配、进度跟踪</Text>
              </Timeline.Item>
              <Timeline.Item color="green">
                <Text strong>团队协作</Text>
                <br />
                <Text type="secondary">实时协作功能，支持评论、文件共享、日志记录</Text>
              </Timeline.Item>
              <Timeline.Item color="red">
                <Text strong>投票评估</Text>
                <br />
                <Text type="secondary">公平的投票评估机制，支持多维度评分</Text>
              </Timeline.Item>
              <Timeline.Item color="orange">
                <Text strong>数据分析</Text>
                <br />
                <Text type="secondary">智能数据分析，提供深入的项目和团队洞察</Text>
              </Timeline.Item>
            </Timeline>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default PublicHome;