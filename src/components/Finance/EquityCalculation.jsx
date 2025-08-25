import { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Tabs,
  Row,
  Col,
  Statistic,
  Progress,
  Typography,
  Tag,
  Space,
  Button,
  Modal,
  Descriptions,
  Alert,
  message,
  Empty,
} from 'antd';
import {
  PieChartOutlined,
  CalculatorOutlined,
  RiseOutlined,
  ShareAltOutlined,
  InfoCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import useAuthStore from '../../stores/authStore';
import useVotingStore from '../../stores/votingStore';
import { financeAPI, votingAPI } from '../../services/api';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const EquityCalculation = ({ userId, projectId, votingRoundId }) => {
  const [equityData, setEquityData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [votingRounds, setVotingRounds] = useState([]);

  const { user } = useAuthStore();
  const { activeRound } = useVotingStore();

  useEffect(() => {
    loadVotingRounds();
  }, []);

  useEffect(() => {
    if (votingRoundId || activeRound?.id) {
      loadEquityData();
    }
  }, [userId, projectId, votingRoundId, activeRound?.id]);

  const loadVotingRounds = async () => {
    try {
      const response = await votingAPI.getVotingRounds();
      setVotingRounds(response.data || []);
    } catch (error) {
      console.error('加载投票轮次失败:', error);
    }
  };

  const loadEquityData = async () => {
    setLoading(true);
    try {
      const currentRoundId = votingRoundId || activeRound?.id;
      
      // 获取真实的股权数据
      const [portfolioResponse, realEquityResponse] = await Promise.all([
        financeAPI.getPortfolio(currentRoundId),
        financeAPI.getRealEquity(currentRoundId)
      ]);

      const portfolioData = portfolioResponse.data || {};
      const equityHoldings = portfolioData.equity_holdings || [];
      const realEquityData = realEquityResponse.data || {};

      // 处理个人股份数据
      const personalEquity = {
        totalInvestment: portfolioData.total_investment || 0,
        totalReceived: portfolioData.total_received || 0,
        netEquity: (portfolioData.total_investment || 0) - (portfolioData.total_received || 0),
        userBalance: portfolioData.user_balance || 0,
        projects: equityHoldings.map(holding => ({
          id: holding.id,
          name: holding.target_name,
          investment: holding.investment_amount,
          received: 0, // 这个需要从其他数据源获取
          equityPercentage: holding.equity_percentage,
          contributionPercentage: 0, // 需要从评价数据计算
          finalEquityPercentage: holding.equity_percentage,
          target_type: holding.target_type,
          created_at: holding.created_at
        }))
      };

      // 计算综合统计
      personalEquity.finalEquityPercentage = personalEquity.projects.length > 0 
        ? personalEquity.projects.reduce((sum, p) => sum + p.equityPercentage, 0) / personalEquity.projects.length 
        : 0;

      // 处理历史轮次数据
      const roundHistory = votingRounds.map((round, index) => {
        const roundEquity = equityHoldings.filter(holding => 
          holding.voting_round === round.name
        );
        
        const totalInvestment = roundEquity.reduce((sum, eq) => sum + eq.investment_amount, 0);
        const avgEquity = roundEquity.length > 0 
          ? roundEquity.reduce((sum, eq) => sum + eq.equity_percentage, 0) / roundEquity.length 
          : 0;

        return {
          round: index + 1,
          roundName: round.name,
          totalValuation: totalInvestment * 2, // 简单估算
          myEquity: avgEquity,
          investment: totalInvestment,
          received: 0, // 需要从其他数据计算
        };
      });

      setEquityData({
        personalEquity,
        projectEquity: {
          totalValuation: personalEquity.totalInvestment * 2,
          totalInvestment: personalEquity.totalInvestment,
          members: [] // 项目成员数据需要额外获取
        },
        roundHistory
      });

    } catch (error) {
      console.error('加载股份数据失败:', error);
      message.error('加载股份数据失败');
    } finally {
      setLoading(false);
    }
  };

  const showDetailModal = (entity) => {
    setSelectedEntity(entity);
    setDetailModalVisible(true);
  };

  // 个人股份表格列
  const personalEquityColumns = [
    {
      title: '项目/用户名称',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space>
          <Text strong>{text}</Text>
          <Tag color={record.target_type === '项目' ? 'blue' : 'green'}>
            {record.target_type}
          </Tag>
        </Space>
      ),
    },
    {
      title: '投资金额',
      dataIndex: 'investment',
      key: 'investment',
      render: (amount) => <Text style={{ color: '#ff4d4f' }}>¥{Number(amount || 0).toFixed(2)}</Text>,
    },
    {
      title: '股份比例',
      dataIndex: 'equityPercentage',
      key: 'equityPercentage',
      render: (percentage) => (
        <Text strong style={{ color: '#1890ff' }}>
          {Number(percentage || 0).toFixed(2)}%
        </Text>
      ),
    },
    {
      title: '投资时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => new Date(date).toLocaleDateString(),
    },
  ];

  // 历史轮次数据
  const historyData = equityData?.roundHistory?.map(round => ({
    round: `${round.roundName}`,
    估值: round.totalValuation,
    我的股份: round.myEquity,
    投资: round.investment,
  })) || [];

  return (
    <div>
      <Card loading={loading}>
        <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
          <Col>
            <Title level={4}>
              <ShareAltOutlined /> 股份计算
            </Title>
            <Text type="secondary">
              基于真实投资和评价数据的股份分析
            </Text>
          </Col>
          <Col>
            <Button
              icon={<ReloadOutlined />}
              onClick={loadEquityData}
              loading={loading}
            >
              刷新数据
            </Button>
          </Col>
        </Row>

        <Tabs defaultActiveKey="personal">
          <TabPane 
            tab={
              <span>
                <ShareAltOutlined />
                我的股份
              </span>
            } 
            key="personal"
          >
            {equityData?.personalEquity ? (
              <>
                <Row gutter={16} style={{ marginBottom: 24 }}>
                  <Col span={6}>
                    <Statistic
                      title="总投资"
                      value={equityData.personalEquity.totalInvestment}
                      precision={2}
                      prefix="¥"
                      valueStyle={{ color: '#ff4d4f' }}
                    />
                  </Col>
                  <Col span={6}>
                    <Statistic
                      title="账户余额"
                      value={equityData.personalEquity.userBalance}
                      precision={2}
                      prefix="¥"
                      valueStyle={{ color: '#52c41a' }}
                    />
                  </Col>
                  <Col span={6}>
                    <Statistic
                      title="投资项目数"
                      value={equityData.personalEquity.projects.length}
                      suffix="个"
                      valueStyle={{ color: '#1890ff' }}
                    />
                  </Col>
                  <Col span={6}>
                    <Statistic
                      title="平均股份"
                      value={equityData.personalEquity.finalEquityPercentage}
                      precision={2}
                      suffix="%"
                      valueStyle={{ color: '#722ed1' }}
                    />
                  </Col>
                </Row>

                <Alert
                  message="数据说明"
                  description="股份数据基于您的真实投资记录计算。投资金额和股份比例来自自评增资记录。"
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                />

                {equityData.personalEquity.projects.length > 0 ? (
                  <Table
                    columns={personalEquityColumns}
                    dataSource={equityData.personalEquity.projects}
                    rowKey="id"
                    pagination={false}
                    size="small"
                  />
                ) : (
                  <Empty description="暂无投资记录" />
                )}
              </>
            ) : (
              <Empty description="暂无股份数据" />
            )}
          </TabPane>

          <TabPane 
            tab={
              <span>
                <RiseOutlined />
                轮次历史
              </span>
            } 
            key="history"
          >
            {equityData?.roundHistory && equityData.roundHistory.length > 0 ? (
              <>
                <Card title="投资历史趋势" style={{ marginBottom: 16 }}>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={historyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="round" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="投资" fill="#ff4d4f" />
                      <Bar dataKey="我的股份" fill="#1890ff" />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>

                <Table
                  columns={[
                    { title: '投票轮次', dataIndex: 'roundName', key: 'roundName' },
                    { 
                      title: '我的投资', 
                      dataIndex: 'investment', 
                      key: 'investment',
                      render: (value) => `¥${Number(value || 0).toFixed(2)}`
                    },
                    { 
                      title: '平均股份', 
                      dataIndex: 'myEquity', 
                      key: 'myEquity',
                      render: (value) => `${Number(value || 0).toFixed(2)}%`
                    },
                    { 
                      title: '估算价值', 
                      dataIndex: 'totalValuation', 
                      key: 'totalValuation',
                      render: (value) => `¥${Number(value || 0).toFixed(2)}`
                    },
                  ]}
                  dataSource={equityData.roundHistory}
                  rowKey="round"
                  pagination={false}
                  size="small"
                />
              </>
            ) : (
              <Empty description="暂无历史数据" />
            )}
          </TabPane>
        </Tabs>
      </Card>

      {/* 成员详情Modal */}
      <Modal
        title={`${selectedEntity?.name} 的股份详情`}
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={500}
      >
        {selectedEntity && (
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="名称">{selectedEntity.name}</Descriptions.Item>
            <Descriptions.Item label="类型">{selectedEntity.target_type}</Descriptions.Item>
            <Descriptions.Item label="投资金额">¥{Number(selectedEntity.investment || 0).toFixed(2)}</Descriptions.Item>
            <Descriptions.Item label="股份比例">{Number(selectedEntity.equityPercentage || 0).toFixed(2)}%</Descriptions.Item>
            <Descriptions.Item label="投资时间" span={2}>
              {new Date(selectedEntity.created_at).toLocaleString()}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default EquityCalculation;