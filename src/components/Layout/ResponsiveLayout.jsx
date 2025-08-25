import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Layout as AntLayout,
  Space,
  Button,
  Avatar,
  Dropdown,
  Typography,
  Affix,
} from 'antd';
import {
  HomeOutlined,
  ProjectOutlined,
  DollarOutlined,
  UserOutlined,
  LogoutOutlined,
  BarChartOutlined,
  LoginOutlined,
  ShopOutlined,
} from '@ant-design/icons';
import useAuthStore from '../../stores/authStore';
import LoginDialog from '../Auth/LoginDialog';
import RegisterDialog from '../Auth/RegisterDialog';
import './ResponsiveLayout.css';

const { Content } = AntLayout;
const { Text } = Typography;

const ResponsiveLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAuthenticated } = useAuthStore();
  const [loginModalVisible, setLoginModalVisible] = useState(false);
  const [registerModalVisible, setRegisterModalVisible] = useState(false);

  // 底部导航菜单项
  const bottomNavItems = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: '首页',
      path: '/'
    },
    {
      key: '/projects',
      icon: <ProjectOutlined />,
      label: '项目',
      path: '/projects'
    },
    {
      key: '/finance',
      icon: <DollarOutlined />,
      label: '财务',
      path: '/finance'
    },
    {
      key: '/evaluation',
      icon: <BarChartOutlined />,
      label: '分析',
      path: '/evaluation'
    }
  ];

  const handleNavClick = (path) => {
    navigate(path);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleLogin = () => {
    setLoginModalVisible(true);
  };

  const handleRegister = () => {
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

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人资料',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ];

  return (
    <AntLayout className="responsive-layout">
      {/* 顶部Header - 移动端简化，桌面端保留用户信息 */}
      <div className="top-header">
        <div className="header-content">
          <div className="logo">
            <Text strong style={{ fontSize: '18px', color: '#1890ff' }}>
              功分易
            </Text>
          </div>
          
          {/* 右侧用户信息或登录按钮 */}
          <div className="user-info desktop-only">
            {isAuthenticated() ? (
              <Space>
                <Text>欢迎，{user?.username}</Text>
                <Dropdown
                  menu={{ items: userMenuItems }}
                  placement="bottomRight"
                  arrow
                >
                  <Avatar
                    style={{ cursor: 'pointer' }}
                    src={user?.avatar}
                    icon={<UserOutlined />}
                  />
                </Dropdown>
              </Space>
            ) : (
              <Space>
                <Button onClick={handleLogin}>
                  <LoginOutlined /> 登录
                </Button>
                <Button type="primary" onClick={handleRegister}>
                  注册
                </Button>
              </Space>
            )}
          </div>
        </div>
      </div>

      {/* 主内容区域 */}
      <Content className="main-content">
        <div className="content-wrapper">
          <Outlet />
        </div>
      </Content>

      {/* 底部导航 - 适配移动端和小程序 */}
      <Affix offsetBottom={0}>
        <div className="bottom-navigation">
          {bottomNavItems.map((item) => (
            <div
              key={item.key}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => handleNavClick(item.path)}
            >
              <div className="nav-icon">
                {item.icon}
              </div>
              <div className="nav-label">
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </Affix>

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
    </AntLayout>
  );
};

export default ResponsiveLayout;