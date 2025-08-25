import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Tag,
  Space,
  message,
  Popconfirm,
  Typography,
  Row,
  Col,
  Statistic,
  Alert,
  Tabs,
  Descriptions
} from 'antd';
import {
  PlusOutlined,
  DollarOutlined,
  ShareAltOutlined,
  BankOutlined,
  CheckOutlined,
  EyeOutlined,
  WalletOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../../services/api';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const ProjectRevenue = ({ projectId, isProjectOwner }) => {
  const [revenues, setRevenues] = useState([]);
  const [distributions, setDistributions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [distributionModalVisible, setDistributionModalVisible] = useState(false);
  const [selectedRevenue, setSelectedRevenue] = useState(null);
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState('revenues');
  const [revenueStats, setRevenueStats] = useState({
    totalRevenue: 0,
    totalDistributed: 0,
    pendingDistribution: 0,
    myEarnings: 0
  });

  useEffect(() => {
    fetchRevenues();
    fetchDistributions();
    calculateStats();
  }, [projectId]);

  const fetchRevenues = async () => {
    try {
      setLoading(true);
      const response = await api.get('/projects/revenues/', {
        params: { project: projectId }
      });
      setRevenues(response.data.results || response.data);
    } catch (error) {
      message.error('获取收益信息失败');
      console.error('Error fetching revenues:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDistributions = async () => {
    try {
      const response = await api.get('/projects/revenues/my_distributions/');
      const myDistributions = response.data.results || response.data;
      setDistributions(myDistributions.filter(d => 
        d.project_name && d.project_name.includes(projectId) // 简化的项目筛选
      ));
    } catch (error) {
      console.error('Error fetching distributions:', error);
    }
  };

  const calculateStats = () => {
    const totalRevenue = revenues.reduce((sum, rev) => sum + parseFloat(rev.amount || 0), 0);
    const totalDistributed = revenues
      .filter(rev => rev.is_distributed)
      .reduce((sum, rev) => sum + parseFloat(rev.net_amount || 0), 0);
    const pendingDistribution = totalRevenue - totalDistributed;
    const myEarnings = distributions.reduce((sum, dist) => sum + parseFloat(dist.amount || 0), 0);

    setRevenueStats({
      totalRevenue,
      totalDistributed,
      pendingDistribution,
      myEarnings
    });
  };

  useEffect(() => {
    calculateStats();
  }, [revenues, distributions]);

  const handleCreateRevenue = () => {
    setModalVisible(true);
    form.resetFields();
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      const revenueData = {
        ...values,
        project: projectId,
        revenue_date: values.revenue_date.format('YYYY-MM-DD')
      };

      await api.post('/projects/revenues/', revenueData);
      message.success('收益记录创建成功');
      setModalVisible(false);
      form.resetFields();
      fetchRevenues();
    } catch (error) {
      message.error('创建收益记录失败');
      console.error('Error creating revenue:', error);
    }
  };

  const handleDistributeRevenue = async (revenueId) => {
    try {
      const response = await api.post(`/projects/revenues/${revenueId}/distribute/`);
      message.success('收益分配成功');
      fetchRevenues();
      fetchDistributions();
      
      // 显示分配详情
      if (response.data.distributions) {
        setSelectedRevenue({
          ...revenues.find(r => r.id === revenueId),
          distributions: response.data.distributions
        });
        setDistributionModalVisible(true);
      }
    } catch (error) {
      message.error('收益分配失败');
      console.error('Error distributing revenue:', error);
    }
  };

  const revenueColumns = [
    {
      title: '收益类型',
      dataIndex: 'revenue_type_display',
      key: 'revenue_type',
      render: (text, record) => (
        <Space direction="vertical" size="small">
          <Tag color="blue">{text}</Tag>
          {record.source && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              来源: {record.source}
            </Text>
          )}
        </Space>
      )
    },
    {
      title: '收益描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (text) => (
        <Text ellipsis style={{ maxWidth: 200 }}>
          {text}
        </Text>
      )
    },
    {
      title: '金额',
      key: 'amounts',
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <Statistic
            title="总收益"
            value={record.amount}
            precision={2}
            prefix="¥"
            valueStyle={{ fontSize: 14, color: '#52c41a' }}
          />
          {record.associated_costs > 0 && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              成本: ¥{record.associated_costs}
            </Text>
          )}
          <Text strong style={{ color: '#1890ff' }}>
            净收益: ¥{record.net_amount}
          </Text>
        </Space>
      )
    },
    {
      title: '收益日期',
      dataIndex: 'revenue_date',
      key: 'revenue_date',
      render: (date) => dayjs(date).format('YYYY-MM-DD')
    },
    {
      title: '记录人',
      dataIndex: 'recorded_by_name',
      key: 'recorded_by'
    },
    {
      title: '分配状态',
      key: 'distribution_status',
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <Tag color={record.is_distributed ? 'success' : 'warning'}>
            {record.is_distributed ? '已分配' : '待分配'}
          </Tag>
          {record.distribution_date && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              {dayjs(record.distribution_date).format('YYYY-MM-DD')}
            </Text>
          )}
        </Space>
      )
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record) => (
        <Space>
          {isProjectOwner && !record.is_distributed && (
            <Popconfirm
              title="确定要分配这笔收益吗？"
              description="分配后将根据成员股份比例自动计算分配金额"
              onConfirm={() => handleDistributeRevenue(record.id)}
            >
              <Button
                type="primary"
                size="small"
                icon={<ShareAltOutlined />}
              >
                分配
              </Button>
            </Popconfirm>
          )}
          
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => {
              setSelectedRevenue(record);
              setDistributionModalVisible(true);
            }}
          >
            详情
          </Button>
        </Space>
      )
    }
  ];

  const distributionColumns = [
    {
      title: '收益来源',
      key: 'revenue_info',
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <Text strong>{record.revenue_type}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            总额: ¥{record.revenue_amount}
          </Text>
        </Space>
      )
    },
    {
      title: '分配金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => (
        <Statistic
          value={amount}
          precision={2}
          prefix="¥"
          valueStyle={{ fontSize: 16, color: '#52c41a' }}
        />
      )
    },
    {
      title: '股份比例',
      dataIndex: 'equity_percentage_at_time',
      key: 'equity_percentage',
      render: (percentage) => `${percentage}%`
    },
    {
      title: '支付状态',
      key: 'payment_status',
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <Tag color={record.is_paid ? 'success' : 'warning'}>
            {record.is_paid ? '已支付' : '待支付'}
          </Tag>
          {record.paid_at && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              {dayjs(record.paid_at).format('YYYY-MM-DD')}
            </Text>
          )}
          {record.payment_method && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              方式: {record.payment_method}
            </Text>
          )}
        </Space>
      )
    },
    {
      title: '分配时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => dayjs(date).format('YYYY-MM-DD HH:mm')
    }
  ];

  return (
    <div>
      {/* 统计面板 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总收益"
              value={revenueStats.totalRevenue}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已分配"
              value={revenueStats.totalDistributed}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="待分配"
              value={revenueStats.pendingDistribution}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="我的收益"
              value={revenueStats.myEarnings}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <Tabs.TabPane tab="收益记录" key="revenues">
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
            <Title level={4}>收益管理</Title>
            {isProjectOwner && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreateRevenue}
              >
                记录收益
              </Button>
            )}
          </div>

          {revenueStats.pendingDistribution > 0 && isProjectOwner && (
            <Alert
              message="有待分配收益"
              description={`当前有 ¥${revenueStats.pendingDistribution.toFixed(2)} 的收益尚未分配给项目成员`}
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          <Table
            columns={revenueColumns}
            dataSource={revenues}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条收益记录`
            }}
          />
        </Tabs.TabPane>

        <Tabs.TabPane tab={`我的收益 (¥${revenueStats.myEarnings.toFixed(2)})`} key="distributions">
          <Table
            columns={distributionColumns}
            dataSource={distributions}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条分配记录`
            }}
          />
        </Tabs.TabPane>
      </Tabs>

      {/* 记录收益Modal */}
      <Modal
        title="记录项目收益"
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="revenue_type"
                label="收益类型"
                rules={[{ required: true, message: '请选择收益类型' }]}
              >
                <Select placeholder="请选择收益类型">
                  <Option value="investment">投资收入</Option>
                  <Option value="sales">销售收入</Option>
                  <Option value="service">服务收入</Option>
                  <Option value="licensing">授权收入</Option>
                  <Option value="grant">资助资金</Option>
                  <Option value="other">其他收入</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="revenue_date"
                label="收益日期"
                rules={[{ required: true, message: '请选择收益日期' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="amount"
                label="收益金额"
                rules={[{ required: true, message: '请输入收益金额' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  precision={2}
                  placeholder="0.00"
                  addonBefore="¥"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="associated_costs" label="相关成本">
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  precision={2}
                  placeholder="0.00"
                  addonBefore="¥"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="收益描述"
            rules={[{ required: true, message: '请输入收益描述' }]}
          >
            <TextArea
              rows={3}
              placeholder="请详细描述收益来源和相关信息"
            />
          </Form.Item>

          <Form.Item name="source" label="收益来源">
            <Input placeholder="如：客户名称、合作伙伴等" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 收益详情/分配详情Modal */}
      <Modal
        title="收益详情"
        open={distributionModalVisible}
        onCancel={() => {
          setDistributionModalVisible(false);
          setSelectedRevenue(null);
        }}
        footer={null}
        width={800}
      >
        {selectedRevenue && (
          <div>
            <Descriptions bordered column={2} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="收益类型">
                {selectedRevenue.revenue_type_display}
              </Descriptions.Item>
              <Descriptions.Item label="收益日期">
                {dayjs(selectedRevenue.revenue_date).format('YYYY-MM-DD')}
              </Descriptions.Item>
              <Descriptions.Item label="总收益">
                ¥{selectedRevenue.amount}
              </Descriptions.Item>
              <Descriptions.Item label="相关成本">
                ¥{selectedRevenue.associated_costs || 0}
              </Descriptions.Item>
              <Descriptions.Item label="净收益">
                ¥{selectedRevenue.net_amount}
              </Descriptions.Item>
              <Descriptions.Item label="分配状态">
                <Tag color={selectedRevenue.is_distributed ? 'success' : 'warning'}>
                  {selectedRevenue.is_distributed ? '已分配' : '待分配'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="收益来源" span={2}>
                {selectedRevenue.source || '无'}
              </Descriptions.Item>
              <Descriptions.Item label="描述" span={2}>
                {selectedRevenue.description}
              </Descriptions.Item>
            </Descriptions>

            {selectedRevenue.distributions && selectedRevenue.distributions.length > 0 && (
              <div>
                <Title level={5}>分配详情</Title>
                <Table
                  dataSource={selectedRevenue.distributions}
                  rowKey="id"
                  pagination={false}
                  size="small"
                  columns={[
                    {
                      title: '成员',
                      dataIndex: 'member_name',
                      key: 'member'
                    },
                    {
                      title: '股份比例',
                      dataIndex: 'equity_percentage_at_time',
                      key: 'equity',
                      render: (percentage) => `${percentage}%`
                    },
                    {
                      title: '分配金额',
                      dataIndex: 'amount',
                      key: 'amount',
                      render: (amount) => `¥${amount}`
                    },
                    {
                      title: '支付状态',
                      key: 'payment_status',
                      render: (_, record) => (
                        <Tag color={record.is_paid ? 'success' : 'warning'}>
                          {record.is_paid ? '已支付' : '待支付'}
                        </Tag>
                      )
                    }
                  ]}
                />
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ProjectRevenue;