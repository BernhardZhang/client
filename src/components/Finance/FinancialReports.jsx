import { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Switch,
  Row,
  Col,
  Typography,
  Tabs,
  Statistic,
  Alert,
  Space,
  Tag,
  message,
  Spin,
} from 'antd';
import {
  EyeOutlined,
  EyeInvisibleOutlined,
  FileTextOutlined,
  BarChartOutlined,
  DollarCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import useAuthStore from '../../stores/authStore';
import { financeAPI } from '../../services/api';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const FinancialReports = ({ userId, projectId, votingRoundId }) => {
  const [reportsVisible, setReportsVisible] = useState(false);
  const [authorizationGranted, setAuthorizationGranted] = useState(false);
  const [financialReports, setFinancialReports] = useState([]);
  const [currentReport, setCurrentReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  
  const { user } = useAuthStore();
  const isOwnReports = userId === user?.id;

  useEffect(() => {
    if (votingRoundId) {
      loadFinancialReports();
    }
  }, [votingRoundId, userId, projectId]);

  const loadFinancialReports = async () => {
    setLoading(true);
    try {
      const response = await financeAPI.getReports(votingRoundId, false);
      const reports = response.data || [];
      
      // 过滤出当前用户或项目的报表
      const relevantReports = reports.results.filter(report => {
        if (userId) {
          return report.user === parseInt(userId);
        } else if (projectId) {
          return report.project === parseInt(projectId);
        }
        return false;
      });
      
      setFinancialReports(relevantReports);
      
      // 如果有报表数据，选择最新的一个作为当前报表
      if (relevantReports.length > 0) {
        const latestReport = relevantReports[0];
        setCurrentReport(latestReport);
        setReportsVisible(true);
      }
      
    } catch (error) {
      console.error('加载财务报表失败:', error);
      message.error('加载财务报表失败');
    } finally {
      setLoading(false);
    }
  };

  const generateFinancialReport = async () => {
    setGenerating(true);
    try {
      const reportData = {
        voting_round_id: votingRoundId,
        ...(userId && { user_id: userId }),
        ...(projectId && { project_id: projectId }),
      };
      
      const response = await financeAPI.generateReport(reportData);
      const newReport = response.data.report;
      
      setCurrentReport(newReport);
      setReportsVisible(true);
      
      // 显示调试信息（如果有）
      if (response.data.debug_info) {
        const debugInfo = response.data.debug_info;
        const hasData = debugInfo.vote_revenue > 0 || debugInfo.investment_revenue > 0 || 
                       debugInfo.vote_costs > 0 || debugInfo.investment_costs > 0;
        
        if (!hasData && debugInfo.debug_counts) {
          message.warning(`数据统计: 收到投票${debugInfo.debug_counts.votes_received_count}条, 投出投票${debugInfo.debug_counts.votes_cast_count}条, 收到投资${debugInfo.debug_counts.investments_received_count}条, 投出投资${debugInfo.debug_counts.investments_made_count}条`, 5);
        }
      }
      
      message.success('财务报表已基于真实交易数据生成');
      
      // 重新加载报表列表
      loadFinancialReports();
      
    } catch (error) {
      console.error('生成财务报表失败:', error);
      message.error(error.response?.data?.error || '生成财务报表失败');
    } finally {
      setGenerating(false);
    }
  };

  const handleAuthorization = async () => {
    if (currentReport) {
      try {
        await financeAPI.authorizeReport(currentReport.id);
        setAuthorizationGranted(true);
        setReportsVisible(true);
        message.success('授权成功');
      } catch (error) {
        console.error('授权失败:', error);
        message.error('授权失败');
      }
    }
  };

  // 转换后端数据格式为前端显示格式
  const formatReportData = (report) => {
    if (!report) return null;
    
    return {
      balanceSheet: {
        assets: [
          { item: '流动资产', amount: report.current_assets, percentage: report.total_assets > 0 ? ((report.current_assets / report.total_assets) * 100).toFixed(2) : 0 },
          { item: '固定资产', amount: report.fixed_assets, percentage: report.total_assets > 0 ? ((report.fixed_assets / report.total_assets) * 100).toFixed(2) : 0 },
        ].filter(item => item.amount > 0),
        liabilities: [
          { item: '总负债', amount: report.total_liabilities, percentage: report.total_assets > 0 ? ((report.total_liabilities / report.total_assets) * 100).toFixed(2) : 0 },
        ].filter(item => item.amount > 0),
        equity: [
          { item: '净资产', amount: report.equity, percentage: report.total_assets > 0 ? ((report.equity / report.total_assets) * 100).toFixed(2) : 0 },
        ].filter(item => item.amount > 0),
        totalAssets: report.total_assets,
        totalLiabilities: report.total_liabilities,
        totalEquity: report.equity,
      },
      incomeStatement: {
        revenue: [
          { item: '营业收入', amount: report.revenue, percentage: report.revenue > 0 ? 100 : 0 },
        ].filter(item => item.amount > 0),
        expenses: [
          { item: '营业成本', amount: report.costs, percentage: report.revenue > 0 ? ((report.costs / report.revenue) * 100).toFixed(2) : 0 },
          { item: '营业费用', amount: report.operating_expenses, percentage: report.revenue > 0 ? ((report.operating_expenses / report.revenue) * 100).toFixed(2) : 0 },
        ].filter(item => item.amount > 0),
        totalRevenue: report.revenue,
        totalExpenses: report.costs + report.operating_expenses,
        netIncome: report.net_profit,
      },
      cashFlow: {
        operating: [
          { item: '经营活动现金流', amount: report.operating_cash_flow },
        ].filter(item => item.amount !== 0),
        investing: [
          { item: '投资活动现金流', amount: report.investing_cash_flow },
        ].filter(item => item.amount !== 0),
        financing: [
          { item: '筹资活动现金流', amount: report.financing_cash_flow },
        ].filter(item => item.amount !== 0),
        netCashFlow: report.net_cash_flow,
      },
    };
  };

  const formattedData = formatReportData(currentReport);

  const balanceSheetColumns = [
    {
      title: '项目',
      dataIndex: 'item',
      key: 'item',
    },
    {
      title: '金额（元）',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => `¥${Number(amount || 0).toFixed(2)}`,
      align: 'right',
    },
    {
      title: '占比',
      dataIndex: 'percentage',
      key: 'percentage',
      render: (percentage) => `${percentage}%`,
      align: 'right',
    },
  ];

  const cashFlowColumns = [
    {
      title: '项目',
      dataIndex: 'item',
      key: 'item',
    },
    {
      title: '金额（元）',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => (
        <Text style={{ color: amount >= 0 ? '#52c41a' : '#ff4d4f' }}>
          ¥{Number(amount || 0).toFixed(2)}
        </Text>
      ),
      align: 'right',
    },
  ];

  return (
    <div>
      <Card>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={4}>
              <FileTextOutlined /> 财务报表
            </Title>
            <Text type="secondary">
              {isOwnReports ? '我的财务报表' : `${currentReport?.entity_name || '用户'}财务报表`}
              {currentReport && (
                <Tag color={currentReport.data_source === 'calculated' ? 'green' : 'blue'} style={{ marginLeft: 8 }}>
                  {currentReport.data_source === 'calculated' ? '系统计算' : '手工输入'}
                </Tag>
              )}
            </Text>
          </Col>
          <Col>
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={loadFinancialReports}
                loading={loading}
              >
                刷新
              </Button>
              
              <Button
                type="primary"
                onClick={generateFinancialReport}
                loading={generating}
                disabled={!votingRoundId}
              >
                生成真实数据报表
              </Button>
              
              {currentReport && !authorizationGranted && !isOwnReports && (
                <Button
                  type="primary"
                  icon={<EyeOutlined />}
                  onClick={handleAuthorization}
                  disabled={authorizationGranted}
                >
                  请求查看授权
                </Button>
              )}
              
              {(isOwnReports || authorizationGranted) && currentReport && (
                <Button
                  icon={reportsVisible ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                  onClick={() => setReportsVisible(!reportsVisible)}
                >
                  {reportsVisible ? '隐藏报表' : '显示报表'}
                </Button>
              )}
            </Space>
          </Col>
        </Row>

        {!currentReport && !loading && (
          <Alert
            message="暂无财务报表数据"
            description="点击生成真实数据报表按钮，系统将根据真实交易数据生成财务报表"
            type="info"
            showIcon
            style={{ marginTop: 16 }}
          />
        )}

        {!authorizationGranted && !isOwnReports && currentReport && (
          <Alert
            message="需要授权才能查看财务报表"
            type="info"
            showIcon
            style={{ marginTop: 16 }}
          />
        )}
      </Card>

      {reportsVisible && (isOwnReports || authorizationGranted) && formattedData && (
        <Card style={{ marginTop: 16 }} loading={loading}>
          <Tabs defaultActiveKey="1">
            <TabPane 
              tab={
                <span>
                  <BarChartOutlined />
                  资产负债表
                </span>
              } 
              key="1"
            >
              <Row gutter={16} style={{ marginBottom: 24 }}>
                <Col span={8}>
                  <Statistic
                    title="总资产"
                    value={formattedData.balanceSheet.totalAssets}
                    prefix="¥"
                    precision={2}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="总负债"
                    value={formattedData.balanceSheet.totalLiabilities}
                    prefix="¥"
                    precision={2}
                    valueStyle={{ color: '#ff4d4f' }}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="净资产"
                    value={formattedData.balanceSheet.totalEquity}
                    prefix="¥"
                    precision={2}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={8}>
                  <Card title="资产" size="small">
                    <Table
                      columns={balanceSheetColumns}
                      dataSource={formattedData.balanceSheet.assets}
                      pagination={false}
                      size="small"
                      rowKey="item"
                    />
                  </Card>
                </Col>
                <Col span={8}>
                  <Card title="负债" size="small">
                    <Table
                      columns={balanceSheetColumns}
                      dataSource={formattedData.balanceSheet.liabilities}
                      pagination={false}
                      size="small"
                      rowKey="item"
                    />
                  </Card>
                </Col>
                <Col span={8}>
                  <Card title="净资产" size="small">
                    <Table
                      columns={balanceSheetColumns}
                      dataSource={formattedData.balanceSheet.equity}
                      pagination={false}
                      size="small"
                      rowKey="item"
                    />
                  </Card>
                </Col>
              </Row>
            </TabPane>

            <TabPane 
              tab={
                <span>
                  <DollarCircleOutlined />
                  利润表
                </span>
              } 
              key="2"
            >
              <Row gutter={16} style={{ marginBottom: 24 }}>
                <Col span={8}>
                  <Statistic
                    title="总收入"
                    value={formattedData.incomeStatement.totalRevenue}
                    prefix="¥"
                    precision={2}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="总支出"
                    value={formattedData.incomeStatement.totalExpenses}
                    prefix="¥"
                    precision={2}
                    valueStyle={{ color: '#ff4d4f' }}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="净利润"
                    value={formattedData.incomeStatement.netIncome}
                    prefix="¥"
                    precision={2}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Card title="收入明细" size="small">
                    <Table
                      columns={balanceSheetColumns}
                      dataSource={formattedData.incomeStatement.revenue}
                      pagination={false}
                      size="small"
                      rowKey="item"
                    />
                  </Card>
                </Col>
                <Col span={12}>
                  <Card title="支出明细" size="small">
                    <Table
                      columns={balanceSheetColumns}
                      dataSource={formattedData.incomeStatement.expenses}
                      pagination={false}
                      size="small"
                      rowKey="item"
                    />
                  </Card>
                </Col>
              </Row>
            </TabPane>

            <TabPane 
              tab={
                <span>
                  <BarChartOutlined />
                  现金流量表
                </span>
              } 
              key="3"
            >
              <Row style={{ marginBottom: 24 }}>
                <Col span={24}>
                  <Statistic
                    title="净现金流"
                    value={formattedData.cashFlow.netCashFlow}
                    prefix="¥"
                    precision={2}
                    valueStyle={{ 
                      color: formattedData.cashFlow.netCashFlow >= 0 ? '#52c41a' : '#ff4d4f' 
                    }}
                  />
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={8}>
                  <Card title="经营活动现金流" size="small">
                    <Table
                      columns={cashFlowColumns}
                      dataSource={formattedData.cashFlow.operating}
                      pagination={false}
                      size="small"
                      rowKey="item"
                    />
                  </Card>
                </Col>
                <Col span={8}>
                  <Card title="投资活动现金流" size="small">
                    <Table
                      columns={cashFlowColumns}
                      dataSource={formattedData.cashFlow.investing}
                      pagination={false}
                      size="small"
                      rowKey="item"
                    />
                  </Card>
                </Col>
                <Col span={8}>
                  <Card title="筹资活动现金流" size="small">
                    <Table
                      columns={cashFlowColumns}
                      dataSource={formattedData.cashFlow.financing}
                      pagination={false}
                      size="small"
                      rowKey="item"
                    />
                  </Card>
                </Col>
              </Row>
            </TabPane>
          </Tabs>
        </Card>
      )}
    </div>
  );
};

export default FinancialReports;