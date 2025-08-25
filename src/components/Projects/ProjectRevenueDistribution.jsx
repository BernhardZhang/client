import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Space,
  message,
  Typography,
  Row,
  Col,
  Statistic,
  Alert,
  Steps,
  List,
  Tag,
  Progress,
  Divider
} from 'antd';
import {
  DollarOutlined,
  ShareAltOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  TrophyOutlined,
  CalculatorOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../../services/api';

const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;

const ProjectRevenueDistribution = ({ projectId, project, isProjectOwner }) => {
  const [distributions, setDistributions] = useState([]);
  const [revenueHistory, setRevenueHistory] = useState([]);
  const [distributionModalVisible, setDistributionModalVisible] = useState(false);
  const [selectedRevenue, setSelectedRevenue] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (projectId) {
      fetchDistributionData();
    }
  }, [projectId]);

  const fetchDistributionData = async () => {
    try {
      setLoading(true);
      // 获取我的收益分配记录
      const distributionsResponse = await api.get('/projects/revenues/my_distributions/');
      const myDistributions = (distributionsResponse.data.results || distributionsResponse.data)
        .filter(d => d.project_name && d.project_name.toLowerCase().includes(project?.name?.toLowerCase()));
      
      setDistributions(myDistributions);

      // 获取项目收益历史
      const revenueResponse = await api.get('/projects/revenues/', {
        params: { project: projectId }
      });
      setRevenueHistory(revenueResponse.data.results || revenueResponse.data);
      
    } catch (error) {
      console.error('Error fetching distribution data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateDistributionStats = () => {
    const totalDistributed = distributions.reduce((sum, d) => sum + parseFloat(d.amount || 0), 0);
    const paidAmount = distributions
      .filter(d => d.is_paid)
      .reduce((sum, d) => sum + parseFloat(d.amount || 0), 0);
    const pendingAmount = totalDistributed - paidAmount;
    
    return {
      totalDistributed,
      paidAmount,
      pendingAmount,
      distributionCount: distributions.length
    };
  };

  const stats = calculateDistributionStats();

  const distributionColumns = [
    {
      title: '收益来源',
      key: 'revenue_info',
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <Text strong>{record.revenue_type}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            收益日期: {dayjs(record.created_at).format('YYYY-MM-DD')}
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            总收益: ¥{record.revenue_amount}
          </Text>
        </Space>
      )
    },
    {
      title: '我的股份',
      dataIndex: 'equity_percentage_at_time',
      key: 'equity',
      render: (percentage) => (
        <div>
          <Progress 
            type="circle" 
            percent={percentage} 
            size={50}
            format={(percent) => `${percent}%`}
          />
        </div>
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
          valueStyle={{ fontSize: 16, color: '#52c41a', fontWeight: 'bold' }}
        />
      )
    },
    {
      title: '支付状态',
      key: 'payment_status',
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <Tag 
            color={record.is_paid ? 'success' : 'warning'}
            icon={record.is_paid ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
          >
            {record.is_paid ? '已支付' : '待支付'}
          </Tag>
          {record.is_paid && record.paid_at && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              支付时间: {dayjs(record.paid_at).format('YYYY-MM-DD')}
            </Text>
          )}
          {record.payment_method && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              支付方式: {record.payment_method}
            </Text>
          )}
        </Space>
      )
    }
  ];

  const DistributionProcess = () => (
    <Card title="收益分配流程说明">
      <Steps direction="vertical" size="small">
        <Step
          status="finish"
          title="项目创建"
          description="建立项目，定义成员股份比例"
          icon={<TrophyOutlined />}
        />
        <Step
          status="finish"
          title="任务完成"
          description="项目成员完成任务，获得评估分数"
          icon={<CheckCircleOutlined />}
        />
        <Step
          status="process"
          title="收益记录"
          description="项目负责人记录项目收益，包括投资、销售等各类收入"
          icon={<DollarOutlined />}
        />
        <Step
          status="wait"
          title="收益分配"
          description="根据成员股份比例自动计算并分配收益"
          icon={<ShareAltOutlined />}
        />
        <Step
          status="wait"
          title="收益支付"
          description="项目负责人向成员支付已分配的收益"
          icon={<CalculatorOutlined />}
        />
      </Steps>
    </Card>
  );

  const RevenueOverview = () => (
    <Row gutter={16} style={{ marginBottom: 24 }}>
      <Col span={6}>
        <Card>
          <Statistic
            title="总收益分配"
            value={stats.totalDistributed}
            precision={2}
            prefix="¥"
            valueStyle={{ color: '#3f8600' }}
          />
        </Card>
      </Col>
      <Col span={6}>
        <Card>
          <Statistic
            title="已支付金额"
            value={stats.paidAmount}
            precision={2}
            prefix="¥"
            valueStyle={{ color: '#1890ff' }}
          />
        </Card>
      </Col>
      <Col span={6}>
        <Card>
          <Statistic
            title="待支付金额"
            value={stats.pendingAmount}
            precision={2}
            prefix="¥"
            valueStyle={{ color: '#faad14' }}
          />
        </Card>
      </Col>
      <Col span={6}>
        <Card>
          <Statistic
            title="分配次数"
            value={stats.distributionCount}
            suffix="次"
            valueStyle={{ color: '#722ed1' }}
          />
        </Card>
      </Col>
    </Row>
  );

  return (
    <div>
      <Title level={4}>项目收益分配</Title>
      
      <RevenueOverview />

      {stats.pendingAmount > 0 && (
        <Alert
          message="有待支付收益"
          description={`您有 ¥${stats.pendingAmount.toFixed(2)} 的收益待项目负责人支付`}
          type="info"
          showIcon
          closable
          style={{ marginBottom: 16 }}
        />
      )}

      <Row gutter={16}>
        <Col span={16}>
          <Card 
            title="我的收益分配记录"
            extra={
              <Text type="secondary">
                总计 {distributions.length} 条记录
              </Text>
            }
          >
            <Table
              columns={distributionColumns}
              dataSource={distributions}
              rowKey="id"
              loading={loading}
              pagination={{
                pageSize: 5,
                showSizeChanger: false,
                showTotal: (total) => `共 ${total} 条分配记录`
              }}
              locale={{
                emptyText: '暂无收益分配记录'
              }}
            />
          </Card>
        </Col>
        
        <Col span={8}>
          <DistributionProcess />
          
          {revenueHistory.length > 0 && (
            <Card 
              title="项目收益历史" 
              style={{ marginTop: 16 }}
              size="small"
            >
              <List
                size="small"
                dataSource={revenueHistory.slice(0, 5)}
                renderItem={(item) => (
                  <List.Item>
                    <div style={{ width: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Text strong>{item.revenue_type_display}</Text>
                        <Text style={{ color: '#52c41a' }}>¥{item.amount}</Text>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {dayjs(item.revenue_date).format('YYYY-MM-DD')}
                        </Text>
                        <Tag 
                          color={item.is_distributed ? 'success' : 'warning'}
                          size="small"
                        >
                          {item.is_distributed ? '已分配' : '待分配'}
                        </Tag>
                      </div>
                    </div>
                  </List.Item>
                )}
              />
              {revenueHistory.length > 5 && (
                <div style={{ textAlign: 'center', marginTop: 8 }}>
                  <Text type="secondary">还有 {revenueHistory.length - 5} 条记录...</Text>
                </div>
              )}
            </Card>
          )}
        </Col>
      </Row>

      {/* 分配详情说明 */}
      <Card 
        title="收益分配说明" 
        style={{ marginTop: 16 }}
        type="inner"
      >
        <Paragraph>
          <Text strong>分配原则：</Text>
          <ul>
            <li>收益按照项目成员的股份比例进行分配</li>
            <li>股份比例在成员加入项目时确定，可由项目负责人调整</li>
            <li>只有活跃的项目成员才参与收益分配</li>
            <li>分配金额 = 净收益 × 个人股份比例 ÷ 总股份比例</li>
          </ul>
        </Paragraph>
        
        <Paragraph>
          <Text strong>支付流程：</Text>
          <ul>
            <li>项目负责人记录收益后，系统自动计算分配金额</li>
            <li>分配记录生成后，等待项目负责人确认支付</li>
            <li>支付完成后，记录支付时间和方式</li>
          </ul>
        </Paragraph>

        {project && (
          <>
            <Divider />
            <div>
              <Text strong>当前项目信息：</Text>
              <ul>
                <li>项目名称：{project.name}</li>
                <li>项目负责人：{project.owner_name}</li>
                <li>成员数量：{project.member_count} 人</li>
                <li>项目估值：¥{Number(project.valuation || 0).toFixed(2)}</li>
              </ul>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

export default ProjectRevenueDistribution;