import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Switch,
  Select,
  Slider,
  ColorPicker,
  Upload,
  Avatar,
  Typography,
  Space,
  Divider,
  Row,
  Col,
  message,
  Modal,
  Tabs,
  Radio,
  Checkbox,
  InputNumber,
  DatePicker,
  TimePicker,
  Layout,
  Menu,
  Badge,
  Tooltip,
  Popconfirm,
  Alert,
  Progress,
  Tag,
  List,
  Descriptions,
  Statistic
} from 'antd';
import {
  SettingOutlined,
  UserOutlined,
  BellOutlined,
  SecurityScanOutlined,
  GlobalOutlined,
  BgColorsOutlined,
  DatabaseOutlined,
  CloudOutlined,
  MobileOutlined,
  DesktopOutlined,
  MoonOutlined,
  SunOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  LockOutlined,
  KeyOutlined,
  MailOutlined,
  PhoneOutlined,
  CameraOutlined,
  DownloadOutlined,
  UploadOutlined,
  DeleteOutlined,
  EditOutlined,
  SaveOutlined,
  ReloadOutlined,
  InfoCircleOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  HomeOutlined,
  ProjectOutlined,
  StarOutlined,
  DollarOutlined,
  BarChartOutlined,
  AppstoreOutlined,
  MessageOutlined,
  FileTextOutlined,
  LoginOutlined,
  LogoutOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import dayjs from 'dayjs';
import useAuthStore from '../../stores/authStore';
import api from '../../services/api';
import './Settings.css';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;
const { Sider, Content } = Layout;
const { TextArea } = Input;

const Settings = () => {
  const [form] = Form.useForm();
  const [profileForm] = Form.useForm();
  const [securityForm] = Form.useForm();
  const [notificationForm] = Form.useForm();
  const [appearanceForm] = Form.useForm();
  const [privacyForm] = Form.useForm();
  
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [collapsed, setCollapsed] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [theme, setTheme] = useState('light');
  const [language, setLanguage] = useState('zh-CN');
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false,
    project: true,
    investment: true,
    task: true,
    system: true
  });
  
  const { user, logout, isAuthenticated, updateProfile } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  // 主导航菜单项
  const mainNavItems = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: '首页',
    },
    {
      key: '/projects',
      icon: <ProjectOutlined />,
      label: '项目管理',
    },
    {
      key: '/project-hall',
      icon: <AppstoreOutlined />,
      label: '项目大厅',
    },
    {
      key: '/points',
      icon: <StarOutlined />,
      label: '积分统计',
    },
    {
      key: '/finance',
      icon: <DollarOutlined />,
      label: '财务管理',
    },
    {
      key: '/evaluation',
      icon: <BarChartOutlined />,
      label: '数据分析',
    },
  ];

  // 功能菜单项
  const functionItems = [
    {
      key: 'notifications',
      icon: <BellOutlined />,
      label: '消息通知',
    },
    {
      key: 'messages',
      icon: <MessageOutlined />,
      label: '私信',
    },
    {
      key: 'documents',
      icon: <FileTextOutlined />,
      label: '文档中心',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '系统设置',
    },
  ];

  const handleMenuClick = ({ key }) => {
    if (key === 'logout') {
      handleLogout();
    } else if (key === 'notifications') {
      navigate('/notifications');
    } else if (key.startsWith('/')) {
      navigate(key);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  useEffect(() => {
    if (user) {
      // 初始化表单数据
      profileForm.setFieldsValue({
        username: user.username,
        email: user.email,
        phone: user.phone,
        student_id: user.student_id,
        bio: user.bio || ''
      });
      setAvatarUrl(user.avatar || '');
    }
  }, [user, profileForm]);

  // 个人资料设置
  const handleProfileUpdate = async (values) => {
    setLoading(true);
    try {
      await api.patch('/users/profile/', values);
      await updateProfile();
      message.success('个人资料更新成功');
    } catch (error) {
      message.error('更新失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 头像上传
  const handleAvatarUpload = async (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    
    try {
      const response = await api.patch('/users/profile/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setAvatarUrl(response.data.avatar);
      await updateProfile();
      message.success('头像更新成功');
    } catch (error) {
      message.error('头像上传失败');
    }
    return false; // 阻止默认上传
  };

  // 安全设置
  const handlePasswordChange = async (values) => {
    setLoading(true);
    try {
      await api.post('/users/change-password/', {
        old_password: values.oldPassword,
        new_password: values.newPassword
      });
      message.success('密码修改成功');
      securityForm.resetFields();
    } catch (error) {
      message.error('密码修改失败');
    } finally {
      setLoading(false);
    }
  };

  // 通知设置
  const handleNotificationChange = (key, value) => {
    setNotifications(prev => ({ ...prev, [key]: value }));
  };

  const handleNotificationSave = async () => {
    setLoading(true);
    try {
      await api.patch('/users/notification-settings/', notifications);
      message.success('通知设置已保存');
    } catch (error) {
      message.error('保存失败');
    } finally {
      setLoading(false);
    }
  };

  // 外观设置
  const handleThemeChange = (value) => {
    setTheme(value);
    // 这里可以添加主题切换逻辑
    message.success('主题已切换');
  };

  const handleLanguageChange = (value) => {
    setLanguage(value);
    message.success('语言设置已保存');
  };

  // 隐私设置
  const handlePrivacySave = async (values) => {
    setLoading(true);
    try {
      await api.patch('/users/privacy-settings/', values);
      message.success('隐私设置已保存');
    } catch (error) {
      message.error('保存失败');
    } finally {
      setLoading(false);
    }
  };

  // 数据导出
  const handleDataExport = async () => {
    setLoading(true);
    try {
      const response = await api.get('/users/export-data/');
      const blob = new Blob([response.data], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `user-data-${dayjs().format('YYYY-MM-DD')}.json`;
      a.click();
      window.URL.revokeObjectURL(url);
      message.success('数据导出成功');
    } catch (error) {
      message.error('数据导出失败');
    } finally {
      setLoading(false);
    }
  };

  // 账户删除
  const handleAccountDelete = async () => {
    Modal.confirm({
      title: '确认删除账户',
      content: '此操作将永久删除您的账户和所有数据，无法恢复。确定要继续吗？',
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await api.delete('/users/account/');
          message.success('账户已删除');
          await logout();
          navigate('/');
        } catch (error) {
          message.error('删除失败');
        }
      }
    });
  };

  return (
    <Layout className="settings-layout">
      {/* 左侧总导航栏 */}
      <Sider 
        width={200} 
        collapsible 
        collapsed={collapsed}
        onCollapse={setCollapsed}
        className="left-sider"
      >
        <div style={{ 
          height: '64px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          borderBottom: '1px solid #303030'
        }}>
          <Text strong style={{ 
            fontSize: collapsed ? '16px' : '18px', 
            color: '#fff',
            whiteSpace: 'nowrap'
          }}>
            {collapsed ? '功分' : '功分易'}
          </Text>
        </div>
        
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={mainNavItems}
          onClick={handleMenuClick}
          className="nav-menu"
        />
        
        <Divider style={{ margin: '16px 0', borderColor: '#303030' }} />
        
        <Menu
          theme="dark"
          mode="inline"
          items={functionItems}
          onClick={handleMenuClick}
          className="nav-menu"
        />
        
        {/* 用户信息区域 */}
        <div className="user-info-area">
          {isAuthenticated() ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Avatar size="small" src={user?.avatar} icon={<UserOutlined />} />
              {!collapsed && (
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ color: '#fff', fontSize: '12px' }} ellipsis>
                    {user?.username}
                  </Text>
                  <div>
                    <Button 
                      type="text" 
                      size="small" 
                      icon={<LogoutOutlined />}
                      onClick={handleLogout}
                      style={{ color: '#fff', padding: 0, height: 'auto' }}
                    >
                      {!collapsed && '退出'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Avatar size="small" icon={<UserOutlined />} />
              {!collapsed && (
                <div>
                  <Button 
                    type="text" 
                    size="small" 
                    icon={<LoginOutlined />}
                    onClick={() => navigate('/')}
                    style={{ color: '#fff', padding: 0, height: 'auto' }}
                  >
                    登录
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </Sider>

      {/* 右侧内容区域 */}
      <Layout>
        <Content className="right-content" style={{ 
          padding: '24px', 
          overflow: 'auto',
          background: '#f5f5f5', 
          minHeight: '100vh'
        }}>
          {/* 页面标题 */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: 'linear-gradient(135deg, #722ed1, #9254de)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(114, 46, 209, 0.3)'
              }}>
                <SettingOutlined style={{ color: 'white', fontSize: 24 }} />
              </div>
              <div>
                <Title level={2} style={{ margin: 0, color: '#262626' }}>
                  系统设置
                </Title>
                <Text type="secondary">管理您的账户设置和偏好</Text>
              </div>
            </div>
          </div>

          {/* 设置内容 */}
          <Card>
            <Tabs 
              activeKey={activeTab} 
              onChange={setActiveTab}
              items={[
                {
                  key: 'profile',
                  label: (
                    <span>
                      <UserOutlined />
                      个人资料
                    </span>
                  ),
                  children: (
                    <div style={{ maxWidth: 600 }}>
                      <Form
                        form={profileForm}
                        layout="vertical"
                        onFinish={handleProfileUpdate}
                      >
                        <Row gutter={16}>
                          <Col span={24}>
                            <div style={{ textAlign: 'center', marginBottom: 24 }}>
                              <Upload
                                beforeUpload={handleAvatarUpload}
                                showUploadList={false}
                                accept="image/*"
                              >
                                <Avatar
                                  size={80}
                                  src={avatarUrl}
                                  icon={<CameraOutlined />}
                                  style={{ cursor: 'pointer' }}
                                />
                              </Upload>
                              <div style={{ marginTop: 8 }}>
                                <Text type="secondary">点击上传头像</Text>
                              </div>
                            </div>
                          </Col>
                        </Row>

                        <Row gutter={16}>
                          <Col span={12}>
                            <Form.Item
                              name="username"
                              label="用户名"
                              rules={[{ required: true, message: '请输入用户名' }]}
                            >
                              <Input prefix={<UserOutlined />} />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item
                              name="email"
                              label="邮箱"
                              rules={[
                                { required: true, message: '请输入邮箱' },
                                { type: 'email', message: '请输入有效的邮箱地址' }
                              ]}
                            >
                              <Input prefix={<MailOutlined />} />
                            </Form.Item>
                          </Col>
                        </Row>

                        <Row gutter={16}>
                          <Col span={12}>
                            <Form.Item
                              name="phone"
                              label="手机号"
                            >
                              <Input prefix={<PhoneOutlined />} />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item
                              name="student_id"
                              label="学号"
                            >
                              <Input />
                            </Form.Item>
                          </Col>
                        </Row>

                        <Form.Item
                          name="bio"
                          label="个人简介"
                        >
                          <TextArea rows={4} placeholder="介绍一下自己..." />
                        </Form.Item>

                        <Form.Item>
                          <Button type="primary" htmlType="submit" loading={loading} icon={<SaveOutlined />}>
                            保存更改
                          </Button>
                        </Form.Item>
                      </Form>
                    </div>
                  )
                },
                {
                  key: 'security',
                  label: (
                    <span>
                      <SecurityScanOutlined />
                      安全设置
                    </span>
                  ),
                  children: (
                    <div style={{ maxWidth: 600 }}>
                      <Form
                        form={securityForm}
                        layout="vertical"
                        onFinish={handlePasswordChange}
                      >
                        <Alert
                          message="安全提示"
                          description="定期更改密码可以提高账户安全性。建议使用包含字母、数字和特殊字符的强密码。"
                          type="info"
                          showIcon
                          style={{ marginBottom: 24 }}
                        />

                        <Form.Item
                          name="oldPassword"
                          label="当前密码"
                          rules={[{ required: true, message: '请输入当前密码' }]}
                        >
                          <Input.Password prefix={<LockOutlined />} />
                        </Form.Item>

                        <Form.Item
                          name="newPassword"
                          label="新密码"
                          rules={[
                            { required: true, message: '请输入新密码' },
                            { min: 8, message: '密码至少8位' }
                          ]}
                        >
                          <Input.Password prefix={<KeyOutlined />} />
                        </Form.Item>

                        <Form.Item
                          name="confirmPassword"
                          label="确认新密码"
                          dependencies={['newPassword']}
                          rules={[
                            { required: true, message: '请确认新密码' },
                            ({ getFieldValue }) => ({
                              validator(_, value) {
                                if (!value || getFieldValue('newPassword') === value) {
                                  return Promise.resolve();
                                }
                                return Promise.reject(new Error('两次输入的密码不一致'));
                              },
                            }),
                          ]}
                        >
                          <Input.Password prefix={<KeyOutlined />} />
                        </Form.Item>

                        <Form.Item>
                          <Button type="primary" htmlType="submit" loading={loading} icon={<SecurityScanOutlined />}>
                            修改密码
                          </Button>
                        </Form.Item>
                      </Form>

                      <Divider />

                      <div>
                        <Title level={4}>两步验证</Title>
                        <Text type="secondary">为您的账户添加额外的安全保护</Text>
                        <div style={{ marginTop: 16 }}>
                          <Button icon={<MobileOutlined />}>
                            启用短信验证
                          </Button>
                          <Button icon={<MailOutlined />} style={{ marginLeft: 8 }}>
                            启用邮箱验证
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                },
                {
                  key: 'notifications',
                  label: (
                    <span>
                      <BellOutlined />
                      通知设置
                    </span>
                  ),
                  children: (
                    <div style={{ maxWidth: 600 }}>
                      <Form layout="vertical">
                        <Title level={4}>通知方式</Title>
                        
                        <Form.Item label="邮件通知">
                          <Switch 
                            checked={notifications.email}
                            onChange={(checked) => handleNotificationChange('email', checked)}
                          />
                        </Form.Item>

                        <Form.Item label="推送通知">
                          <Switch 
                            checked={notifications.push}
                            onChange={(checked) => handleNotificationChange('push', checked)}
                          />
                        </Form.Item>

                        <Form.Item label="短信通知">
                          <Switch 
                            checked={notifications.sms}
                            onChange={(checked) => handleNotificationChange('sms', checked)}
                          />
                        </Form.Item>

                        <Divider />

                        <Title level={4}>通知类型</Title>
                        
                        <Form.Item label="项目相关通知">
                          <Switch 
                            checked={notifications.project}
                            onChange={(checked) => handleNotificationChange('project', checked)}
                          />
                        </Form.Item>

                        <Form.Item label="投资相关通知">
                          <Switch 
                            checked={notifications.investment}
                            onChange={(checked) => handleNotificationChange('investment', checked)}
                          />
                        </Form.Item>

                        <Form.Item label="任务相关通知">
                          <Switch 
                            checked={notifications.task}
                            onChange={(checked) => handleNotificationChange('task', checked)}
                          />
                        </Form.Item>

                        <Form.Item label="系统通知">
                          <Switch 
                            checked={notifications.system}
                            onChange={(checked) => handleNotificationChange('system', checked)}
                          />
                        </Form.Item>

                        <Form.Item>
                          <Button type="primary" onClick={handleNotificationSave} loading={loading} icon={<SaveOutlined />}>
                            保存设置
                          </Button>
                        </Form.Item>
                      </Form>
                    </div>
                  )
                },
                {
                  key: 'appearance',
                  label: (
                    <span>
                      <BgColorsOutlined />
                      外观设置
                    </span>
                  ),
                  children: (
                    <div style={{ maxWidth: 600 }}>
                      <Form layout="vertical">
                        <Form.Item label="主题">
                          <Radio.Group value={theme} onChange={(e) => handleThemeChange(e.target.value)}>
                            <Radio.Button value="light">
                              <SunOutlined /> 浅色主题
                            </Radio.Button>
                            <Radio.Button value="dark">
                              <MoonOutlined /> 深色主题
                            </Radio.Button>
                            <Radio.Button value="auto">
                              <GlobalOutlined /> 跟随系统
                            </Radio.Button>
                          </Radio.Group>
                        </Form.Item>

                        <Form.Item label="语言">
                          <Select value={language} onChange={handleLanguageChange} style={{ width: 200 }}>
                            <Option value="zh-CN">简体中文</Option>
                            <Option value="en-US">English</Option>
                            <Option value="ja-JP">日本語</Option>
                          </Select>
                        </Form.Item>

                        <Form.Item label="字体大小">
                          <Slider
                            min={12}
                            max={18}
                            defaultValue={14}
                            marks={{
                              12: '小',
                              14: '中',
                              16: '大',
                              18: '特大'
                            }}
                          />
                        </Form.Item>

                        <Form.Item label="界面密度">
                          <Radio.Group defaultValue="middle">
                            <Radio.Button value="compact">紧凑</Radio.Button>
                            <Radio.Button value="middle">中等</Radio.Button>
                            <Radio.Button value="comfortable">宽松</Radio.Button>
                          </Radio.Group>
                        </Form.Item>
                      </Form>
                    </div>
                  )
                },
                {
                  key: 'privacy',
                  label: (
                    <span>
                      <EyeOutlined />
                      隐私设置
                    </span>
                  ),
                  children: (
                    <div style={{ maxWidth: 600 }}>
                      <Form
                        form={privacyForm}
                        layout="vertical"
                        onFinish={handlePrivacySave}
                        initialValues={{
                          profile_visibility: 'public',
                          show_online_status: true,
                          allow_messages: true,
                          data_sharing: false
                        }}
                      >
                        <Form.Item
                          name="profile_visibility"
                          label="个人资料可见性"
                        >
                          <Radio.Group>
                            <Radio value="public">公开</Radio>
                            <Radio value="friends">仅好友</Radio>
                            <Radio value="private">私密</Radio>
                          </Radio.Group>
                        </Form.Item>

                        <Form.Item
                          name="show_online_status"
                          label="显示在线状态"
                          valuePropName="checked"
                        >
                          <Switch />
                        </Form.Item>

                        <Form.Item
                          name="allow_messages"
                          label="允许接收私信"
                          valuePropName="checked"
                        >
                          <Switch />
                        </Form.Item>

                        <Form.Item
                          name="data_sharing"
                          label="允许数据用于改进服务"
                          valuePropName="checked"
                        >
                          <Switch />
                        </Form.Item>

                        <Form.Item>
                          <Button type="primary" htmlType="submit" loading={loading} icon={<SaveOutlined />}>
                            保存设置
                          </Button>
                        </Form.Item>
                      </Form>
                    </div>
                  )
                },
                {
                  key: 'data',
                  label: (
                    <span>
                      <DatabaseOutlined />
                      数据管理
                    </span>
                  ),
                  children: (
                    <div style={{ maxWidth: 600 }}>
                      <Title level={4}>数据导出</Title>
                      <Paragraph type="secondary">
                        导出您的个人数据，包括项目信息、任务记录、投资历史等。
                      </Paragraph>
                      <Button 
                        type="primary" 
                        icon={<DownloadOutlined />} 
                        onClick={handleDataExport}
                        loading={loading}
                      >
                        导出数据
                      </Button>

                      <Divider />

                      <Title level={4}>数据清理</Title>
                      <Paragraph type="secondary">
                        清理临时文件和缓存数据，释放存储空间。
                      </Paragraph>
                      <Button icon={<DeleteOutlined />}>
                        清理缓存
                      </Button>

                      <Divider />

                      <Title level={4}>账户删除</Title>
                      <Alert
                        message="危险操作"
                        description="删除账户将永久移除您的所有数据，此操作不可撤销。"
                        type="warning"
                        showIcon
                        style={{ marginBottom: 16 }}
                      />
                      <Popconfirm
                        title="确定要删除账户吗？"
                        description="此操作将永久删除您的账户和所有数据，无法恢复。"
                        onConfirm={handleAccountDelete}
                        okText="确认删除"
                        cancelText="取消"
                        okType="danger"
                      >
                        <Button danger icon={<DeleteOutlined />}>
                          删除账户
                        </Button>
                      </Popconfirm>
                    </div>
                  )
                }
              ]}
            />
          </Card>
        </Content>
      </Layout>
    </Layout>
  );
};

export default Settings;
