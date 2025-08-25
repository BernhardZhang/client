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
} from 'antd';
import {
  DollarOutlined,
  FileTextOutlined,
  ShareAltOutlined,
  EyeOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import LoginPrompt from '../Auth/LoginPrompt';
import useAuthStore from '../../stores/authStore';
import useVotingStore from '../../stores/votingStore';
import { financeAPI } from '../../services/api';
import FinancialReports from './FinancialReports';
import EquityCalculation from './EquityCalculation';

const { Title, Text } = Typography;
const { Option } = Select;

const Finance = () => {
  const [form] = Form.useForm();
  const [isReportModalVisible, setIsReportModalVisible] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [reports, setReports] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [equity, setEquity] = useState([]);
  const [portfolio, setPortfolio] = useState(null);
  const [showAllReports, setShowAllReports] = useState(false);
  
  const { user, isAuthenticated } = useAuthStore();
  const { activeRound, fetchActiveRound } = useVotingStore();

  useEffect(() => {
    // 无论是否登录都获取数据
    fetchActiveRound();
    loadFinanceData();
  }, []);

  const handleLoginRequired = () => {
    setShowLoginPrompt(true);
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
        { id: 1, type: '收入', amount: 5000, description: '项目收入', date: '2024-01-15' },
        { id: 2, type: '支出', amount: 1000, description: '运营成本', date: '2024-01-16' }
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

  // 根据登录状态显示不同的按钮和操作
  const renderFinanceActions = () => {
    if (!isAuthenticated()) {
      return (
        <Space>
          <Button onClick={handleLoginRequired}>
            登录后管理财务
          </Button>
        </Space>
      );
    }

    return (
      <Space>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setIsReportModalVisible(true)}
        >
          创建报表
        </Button>
      </Space>
    );
  };

  const handleCreateReport = async (values) => {
    try {
      // 创建报表的逻辑
      message.success('财务报表创建成功！');
      setIsReportModalVisible(false);
      form.resetFields();
      loadFinanceData();
    } catch (error) {
      message.error('创建失败，请重试');
    }
  };

  // 财务概览数据
  const financialOverview = {
    totalRevenue: reports.reduce((sum, r) => sum + r.revenue, 0),
    totalCosts: reports.reduce((sum, r) => sum + r.costs, 0),
    totalProfit: reports.reduce((sum, r) => sum + r.profit, 0),
    reportCount: reports.length
  };

  const tabItems = [
    {
      key: 'overview',
      label: '财务概览',
      children: (
        <div>
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col span={6}>
              <Card>
                <Statistic
                  title="总收入"
                  value={financialOverview.totalRevenue}
                  prefix={<DollarOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                  suffix="元"
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="总成本"
                  value={financialOverview.totalCosts}
                  prefix={<FileTextOutlined />}
                  valueStyle={{ color: '#fa8c16' }}
                  suffix="元"
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="净利润"
                  value={financialOverview.totalProfit}
                  prefix={<ShareAltOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                  suffix="元"
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="报表数量"
                  value={financialOverview.reportCount}
                  prefix={<EyeOutlined />}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>
            </Col>
          </Row>
          
          {reports.length > 0 && (
            <Card title="收入分布图">
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
      label: '财务报表',
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
      label: '交易记录',
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
                  <Tag color={type === '收入' ? 'green' : 'red'}>{type}</Tag>
                )
              },
              { 
                title: '金额', 
                dataIndex: 'amount', 
                key: 'amount',
                render: (value) => `¥${value.toLocaleString()}`
              },
              { title: '描述', dataIndex: 'description', key: 'description' },
              { title: '日期', dataIndex: 'date', key: 'date' }
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
    <div style={{ padding: '24px' }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>财务管理系统</Title>
        {renderFinanceActions()}
      </Row>

      {/* 财务数据显示区域 */}
      <Tabs defaultActiveKey="overview" items={tabItems} />

      {/* 创建报表Modal - 只有登录用户才能看到 */}
      <Modal
        title="创建财务报表"
        open={isReportModalVisible}
        onCancel={() => setIsReportModalVisible(false)}
        onOk={() => form.submit()}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateReport}
        >
          <Form.Item
            name="revenue"
            label="收入"
            rules={[{ required: true, message: '请输入收入金额！' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              precision={2}
              addonAfter="元"
              placeholder="请输入收入金额"
            />
          </Form.Item>
          
          <Form.Item
            name="costs"
            label="成本"
            rules={[{ required: true, message: '请输入成本金额！' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              precision={2}
              addonAfter="元"
              placeholder="请输入成本金额"
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 登录提示 */}
      <LoginPrompt
        visible={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        message="请登录后使用财务管理功能"
      />
    </div>
  );
};

export default Finance;