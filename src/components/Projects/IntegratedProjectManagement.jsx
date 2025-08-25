import React, { useState, useEffect } from 'react';
import {
  Card,
  Space,
  Typography,
  Button,
  Statistic,
  Row,
  Col,
  Empty,
  Badge,
  Avatar,
  Tag,
} from 'antd';
import {
  ProjectOutlined,
  FileTextOutlined,
  TrophyOutlined,
  TeamOutlined,
  PlusOutlined,
  BarChartOutlined,
  CalendarOutlined,
  StarOutlined,
} from '@ant-design/icons';
import Projects from './Projects';
import UserMeritSummary from '../Merit/UserMeritSummary';
import Merit from '../Merit/Merit';
import LoginPrompt from '../Auth/LoginPrompt';
import useAuthStore from '../../stores/authStore';
import useProjectStore from '../../stores/projectStore';
import LoginDialog from '../Auth/LoginDialog';
import RegisterDialog from '../Auth/RegisterDialog';

const { Title, Text } = Typography;

const IntegratedProjectManagement = () => {
  const [selectedProject, setSelectedProject] = useState(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [loginModalVisible, setLoginModalVisible] = useState(false);
  const [registerModalVisible, setRegisterModalVisible] = useState(false);
  
  const { user, isAuthenticated } = useAuthStore();
  const { projects, fetchProjects } = useProjectStore();
  
  useEffect(() => {
    // 无论是否登录都获取公开项目数据
    fetchProjects();
  }, []);

  const handleLoginRequired = () => {
    setShowLoginPrompt(true);
  };

  const handlePromptLogin = () => {
    setLoginModalVisible(true);
  };

  const handlePromptRegister = () => {
    setRegisterModalVisible(true);
  };

  const handleSwitchToRegister = () => {
    setLoginModalVisible(false);
    setRegisterModalVisible(true);
  };

  const handleSwitchToLogin = () => {
    setRegisterModalVisible(false);
    setLoginModalVisible(true);
  };

  // 获取项目数据（包括公开项目）
  const allProjects = projects || [];
  const userProjects = isAuthenticated() ? allProjects.filter(project => 
    project.owner === user?.id || 
    project.members_detail?.some(member => member.user === user?.id)
  ) : [];

  const publicProjects = allProjects.filter(project => project.is_public);

  // 显示的项目列表
  const displayProjects = isAuthenticated() ? userProjects : publicProjects;

  // 计算统计数据
  const statsProjects = isAuthenticated() ? userProjects : publicProjects;

  // 从项目数据中计算任务统计
  const projectTasks = statsProjects.reduce((acc, project) => {
    const taskCount = project.task_count || 0;
    const completedTaskCount = project.completed_tasks || 0;
    return {
      total: acc.total + taskCount,
      completed: acc.completed + completedTaskCount,
      pending: acc.pending + (taskCount - completedTaskCount)
    };
  }, { total: 0, completed: 0, pending: 0 });

  // 计算总功分（从项目成员数据中获取）
  const totalFunctionScore = isAuthenticated() ? userProjects.reduce((total, project) => {
    const myMembership = project.members_detail?.find(m => m.user === user?.id);
    return total + (Number(myMembership?.contribution_score) || 0);
  }, 0) : 0;

  // 获取项目概览数据
  const getProjectOverview = () => {
    if (!selectedProject) return null;
    
    return {
      totalTasks: selectedProject.task_count || 0,
      completedTasks: selectedProject.completed_tasks || 0,
      progress: selectedProject.progress || 0,
      members: selectedProject.members_detail?.length || 0,
    };
  };

  const projectOverview = getProjectOverview();

  return (
    <div style={{ padding: '16px 0' }}>
      {/* 顶部标题和统计 */}
      <div style={{ marginBottom: '20px' }}>
        <Title level={2} style={{ margin: '0 0 16px 0' }}>
          <ProjectOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
          项目管理
        </Title>
        
        {/* 快速统计卡片 */}
        <Row gutter={12} style={{ marginBottom: '16px' }}>
          <Col xs={12} sm={6}>
            <Card size="small">
              <Statistic
                title={isAuthenticated() ? "我的项目" : "公开项目"}
                value={displayProjects.length}
                prefix={<ProjectOutlined />}
                valueStyle={{ fontSize: '18px' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small">
              <Statistic
                title="待办任务"
                value={projectTasks.pending}
                prefix={<FileTextOutlined />}
                valueStyle={{ fontSize: '18px', color: '#fa8c16' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small">
              <Statistic
                title="已完成"
                value={projectTasks.completed}
                prefix={<BarChartOutlined />}
                valueStyle={{ fontSize: '18px', color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small">
              <Statistic
                title={isAuthenticated() ? "总功分" : "总任务"}
                value={isAuthenticated() ? totalFunctionScore.toFixed(1) : projectTasks.total}
                prefix={<TrophyOutlined />}
                valueStyle={{ fontSize: '18px', color: '#722ed1' }}
              />
            </Card>
          </Col>
        </Row>
      </div>

      {/* 主要内容区域 - 直接显示项目列表 */}
      <Card>
        <Projects 
          onProjectSelect={setSelectedProject} 
          projects={displayProjects}
          isAuthenticated={isAuthenticated()}
          onLoginRequired={handleLoginRequired}
        />
      </Card>
      
      <LoginPrompt
        visible={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        message="请登录后使用完整的项目管理功能"
        onLogin={handlePromptLogin}
        onRegister={handlePromptRegister}
      />

      {/* 登录和注册对话框 */}
      <LoginDialog
        visible={loginModalVisible}
        onClose={() => setLoginModalVisible(false)}
        onSwitchToRegister={handleSwitchToRegister}
      />

      <RegisterDialog
        visible={registerModalVisible}
        onClose={() => setRegisterModalVisible(false)}
        onSwitchToLogin={handleSwitchToLogin}
      />

      {/* 移动端样式调整 */}
      <style jsx>{`
        @media (max-width: 768px) {
          .tab-label {
            display: none;
          }
        }
        
        @media (max-width: 480px) {
          .ant-tabs-tab {
            padding: 8px 12px !important;
          }
          
          .ant-statistic-title {
            font-size: 12px !important;
          }
          
          .ant-statistic-content-value {
            font-size: 16px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default IntegratedProjectManagement;