import { useEffect, useState } from 'react';
import {
  Row,
  Col,
  Card,
  Button,
  Table,
  Modal,
  Form,
  InputNumber,
  Select,
  Space,
  Tag,
  Typography,
  message,
  Tabs,
  Statistic,
  Switch,
  Descriptions,
  Empty,
  Layout,
  Menu,
  Divider,
  List,
  Avatar
} from 'antd';
import {
  DollarOutlined,
  FileTextOutlined,
  ShareAltOutlined,
  EyeOutlined,
  PlusOutlined,
  HomeOutlined,
  ProjectOutlined,
  CheckCircleOutlined,
  StarOutlined,
  BarChartOutlined,
  LoginOutlined,
  LogoutOutlined,
  SettingOutlined,
  BellOutlined,
  MessageOutlined,
  UserOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import LoginPrompt from '../Auth/LoginPrompt';
import useAuthStore from '../../stores/authStore';
import useVotingStore from '../../stores/votingStore';
import { financeAPI } from '../../services/api';
import FinancialReports from './FinancialReports';
import EquityCalculation from './EquityCalculation';
import './Finance.css';

const { Title, Text } = Typography;
const { Option } = Select;
const { Sider, Content } = Layout;

const Finance = () => {
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [reports, setReports] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [equity, setEquity] = useState([]);
  const [collapsed, setCollapsed] = useState(false);
  const [rechargeModalVisible, setRechargeModalVisible] = useState(false);
  const [rechargeForm] = Form.useForm();
  
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAuthenticated } = useAuthStore();
  const { activeRound, fetchActiveRound } = useVotingStore();

  useEffect(() => {
    // 无论是否登录都获取数据
    fetchActiveRound();
    loadFinanceData();
  }, []);

  const handleLoginRequired = () => {
    setShowLoginPrompt(true);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleRecharge = async (values) => {
    try {
      // 这里应该是实际的充值API调用
      message.success(`充值成功！充值金额：¥${values.amount}`);
      setRechargeModalVisible(false);
      rechargeForm.resetFields();
      
      // 添加新的充值记录到交易列表
      const newTransaction = {
        id: transactions.length + 1,
        type: '充值',
        amount: values.amount,
        description: `${values.paymentMethod}充值`,
        date: new Date().toISOString().split('T')[0]
      };
      setTransactions(prev => [newTransaction, ...prev]);
      
    } catch (error) {
      message.error('充值失败，请重试');
    }
  };

  // 模拟数据加载函数
  const loadFinanceData = async () => {
    try {
      // 这里应该是实际的API调用
      // 模拟一些数据
      setReports([
        {
          id: 1,
          user_name: '张三',
          revenue: 10000,
          costs: 3000,
          profit: 7000,
          created_at: '2024-01-15'
        },
        {
          id: 2,
          user_name: '李四',
          revenue: 8000,
          costs: 2000,
          profit: 6000,
          created_at: '2024-01-16'
        }
      ]);
      
      setTransactions([
        { id: 1, type: '充值', amount: 1000, description: '支付宝充值', date: '2024-01-15' },
        { id: 2, type: '充值', amount: 2000, description: '微信充值', date: '2024-01-16' },
        { id: 3, type: '充值', amount: 1500, description: '银行卡充值', date: '2024-01-17' },
        { id: 4, type: '充值', amount: 500, description: '支付宝充值', date: '2024-01-18' }
      ]);
      
      setEquity([
        { user: '张三', equity: 40 },
        { user: '李四', equity: 35 },
        { user: '王五', equity: 25 }
      ]);
      
    } catch (error) {
      console.error('加载财务数据失败:', error);
    }
  };

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
      key: '/task-hall',
      icon: <CheckCircleOutlined />,
      label: '任务大厅',
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
    } else if (key.startsWith('/')) {
      navigate(key);
    }
  };



  // 财务概览数据
  const financialOverview = {
    totalRevenue: reports.reduce((sum, r) => sum + r.revenue, 0),
    totalCosts: reports.reduce((sum, r) => sum + r.costs, 0),
    totalProfit: reports.reduce((sum, r) => sum + r.profit, 0),
    reportCount: reports.length
  };

  // 最近交易记录
  const recentTransactions = transactions.slice(0, 5);

  const tabItems = [
    {
      key: 'overview',
      label: '项目财务概览',
      children: (
        <div>
          {reports.length > 0 && (
            <Card title="项目收入分布图">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    dataKey="revenue"
                    data={reports.map(r => ({ name: r.user_name, value: r.revenue }))}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    label
                  >
                    {reports.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={`#${Math.floor(Math.random()*16777215).toString(16)}`} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          )}
        </div>
      ),
    },
    {
      key: 'reports',
      label: '项目财务报表',
      children: (
        <Card>
          <Table
            dataSource={reports}
            columns={[
              { title: '用户', dataIndex: 'user_name', key: 'user_name' },
              { 
                title: '收入', 
                dataIndex: 'revenue', 
                key: 'revenue',
                render: (value) => `¥${value.toLocaleString()}`
              },
              { 
                title: '成本', 
                dataIndex: 'costs', 
                key: 'costs',
                render: (value) => `¥${value.toLocaleString()}`
              },
              { 
                title: '利润', 
                dataIndex: 'profit', 
                key: 'profit',
                render: (value) => (
                  <span style={{ color: value > 0 ? '#52c41a' : '#f5222d' }}>
                    ¥{value.toLocaleString()}
                  </span>
                )
              },
              { title: '创建时间', dataIndex: 'created_at', key: 'created_at' }
            ]}
            pagination={{ pageSize: 10 }}
          />
        </Card>
      ),
    },
    {
      key: 'transactions',
      label: '充值记录',
      children: (
        <Card>
          <Table
            dataSource={transactions}
            columns={[
              { 
                title: '类型', 
                dataIndex: 'type', 
                key: 'type',
                render: (type) => (
                  <Tag color="green">{type}</Tag>
                )
              },
              { 
                title: '金额', 
                dataIndex: 'amount', 
                key: 'amount',
                render: (value) => `¥${value.toLocaleString()}`
              },
              { title: '充值方式', dataIndex: 'description', key: 'description' },
              { title: '充值日期', dataIndex: 'date', key: 'date' }
            ]}
            pagination={{ pageSize: 10 }}
          />
        </Card>
      ),
    },
    {
      key: 'equity',
      label: '股权分配',
      children: (
        <Card>
          <Table
            dataSource={equity}
            columns={[
              { title: '用户', dataIndex: 'user', key: 'user' },
              { 
                title: '股权比例', 
                dataIndex: 'equity', 
                key: 'equity',
                render: (value) => `${value}%`
              }
            ]}
            pagination={false}
          />
        </Card>
      ),
    },
  ];

  return (
    <Layout className="finance-layout">
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



      {/* 右侧内容栏 */}
      <Layout>
        <Content className="right-content" style={{ 
          padding: '24px', 
          overflow: 'auto'
        }}>
          {/* 顶部标题 */}
          <div style={{ marginBottom: '24px' }}>
            <Row justify="space-between" align="middle" style={{ marginBottom: '16px' }}>
              <Title level={2} style={{ margin: 0 }}>
                <DollarOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
                财务统计
              </Title>
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={() => setRechargeModalVisible(true)}
              >
                充值
              </Button>
            </Row>
          </div>

          {/* 快速统计 */}
          <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
            <Col xs={12} sm={6}>
              <Card>
                <Statistic
                  title="项目总收入"
                  value={financialOverview.totalRevenue}
                  prefix={<DollarOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                  suffix="元"
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card>
                <Statistic
                  title="项目总成本"
                  value={financialOverview.totalCosts}
                  prefix={<FileTextOutlined />}
                  valueStyle={{ color: '#fa8c16' }}
                  suffix="元"
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card>
                <Statistic
                  title="项目净利润"
                  value={financialOverview.totalProfit}
                  prefix={<ShareAltOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                  suffix="元"
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card>
                <Statistic
                  title="充值总额"
                  value={financialOverview.totalRecharge || 5000}
                  prefix={<PlusOutlined />}
                  valueStyle={{ color: '#722ed1' }}
                  suffix="元"
                />
              </Card>
            </Col>
          </Row>

          {/* 财务数据显示区域 */}
          <Tabs defaultActiveKey="overview" items={tabItems} />
        </Content>
      </Layout>



      {/* 充值Modal */}
      <Modal
        title="账户充值"
        open={rechargeModalVisible}
        onOk={() => rechargeForm.submit()}
        onCancel={() => {
          setRechargeModalVisible(false);
          rechargeForm.resetFields();
        }}
        destroyOnClose
      >
        <Form
          form={rechargeForm}
          layout="vertical"
          onFinish={handleRecharge}
        >
          <Form.Item
            name="amount"
            label="充值金额"
            rules={[
              { required: true, message: '请输入充值金额！' },
              { type: 'number', min: 1, message: '充值金额必须大于0！' }
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              precision={2}
              addonAfter="元"
              placeholder="请输入充值金额"
              min={1}
            />
          </Form.Item>
          
          <Form.Item
            name="paymentMethod"
            label="支付方式"
            rules={[{ required: true, message: '请选择支付方式！' }]}
          >
            <Select placeholder="请选择支付方式">
              <Option value="支付宝">支付宝</Option>
              <Option value="微信">微信</Option>
              <Option value="银行卡">银行卡</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* 登录提示 */}
      <LoginPrompt
        visible={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        message="请登录后使用财务管理功能"
      />
    </Layout>
  );
};

export default Finance;