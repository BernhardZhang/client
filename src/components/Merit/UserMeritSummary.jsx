import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Typography,
  Space,
  Tag,
  Progress,
  Timeline,
  Alert,
  Empty,
  Spin
} from 'antd';
import {
  TrophyOutlined,
  ProjectOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  BarChartOutlined,
  StarOutlined
} from '@ant-design/icons';
import { tasksAPI } from '../../services/api';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;

const UserMeritSummary = () => {
  const [loading, setLoading] = useState(false);
  const [meritData, setMeritData] = useState(null);

  // 获取用户功分汇总数据
  const fetchMeritSummary = async () => {
    setLoading(true);
    try {
      const response = await tasksAPI.getUserMeritSummary();
      setMeritData(response.data);
    } catch (error) {
      console.error('获取功分汇总失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeritSummary();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!meritData) {
    return (
      <Empty
        description="暂无功分数据"
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    );
  }

  const { summary, project_stats, recent_contributions } = meritData;

  // 项目统计表格列
  const projectColumns = [
    {
      title: '项目名称',
      dataIndex: 'project_name',
      key: 'project_name',
      render: (text) => (
        <Space>
          <ProjectOutlined />
          {text}
        </Space>
      )
    },
    {
      title: '任务数量',
      dataIndex: 'task_count',
      key: 'task_count',
      render: (count) => (
        <Tag color="blue">{count} 个任务</Tag>
      )
    },
    {
      title: '总功分',
      dataIndex: 'total_merit',
      key: 'total_merit',
      render: (merit) => (
        <Text strong style={{ color: '#52c41a' }}>
          {merit?.toFixed(2) || '0.00'}
        </Text>
      ),
      sorter: (a, b) => a.total_merit - b.total_merit
    },
    {
      title: '平均功分',
      key: 'average_merit',
      render: (_, record) => {
        const avg = record.task_count > 0 ? record.total_merit / record.task_count : 0;
        return (
          <Text style={{ color: '#1890ff' }}>
            {avg.toFixed(2)}
          </Text>
        );
      }
    }
  ];

  // 展开行显示任务详情
  const expandedRowRender = (record) => {
    const taskColumns = [
      {
        title: '任务名称',
        dataIndex: 'task_title',
        key: 'task_title'
      },
      {
        title: '功分',
        dataIndex: 'merit_points',
        key: 'merit_points',
        render: (points) => (
          <Text strong style={{ color: '#52c41a' }}>
            {points?.toFixed(2)}
          </Text>
        )
      },
      {
        title: '功分占比',
        dataIndex: 'merit_percentage',
        key: 'merit_percentage',
        render: (percentage) => (
          <Progress percent={percentage?.toFixed(1)} size="small" />
        )
      },
      {
        title: '计算方法',
        dataIndex: 'calculation_method',
        key: 'calculation_method',
        render: (method) => (
          <Tag color="orange">{method}</Tag>
        )
      },
      {
        title: '计算时间',
        dataIndex: 'calculated_at',
        key: 'calculated_at',
        render: (date) => dayjs(date).format('YYYY-MM-DD')
      }
    ];

    return (
      <Table
        columns={taskColumns}
        dataSource={record.tasks}
        pagination={false}
        size="small"
        rowKey="task_id"
      />
    );
  };

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>
        <TrophyOutlined style={{ marginRight: '8px', color: '#52c41a' }} />
        我的功分汇总
      </Title>

      {/* 总体统计 */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总功分"
              value={summary.total_merit_points}
              precision={2}
              valueStyle={{ color: '#3f8600' }}
              prefix={<TrophyOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="任务总数"
              value={summary.total_tasks}
              prefix={<BarChartOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="平均功分"
              value={summary.average_merit_per_task}
              precision={2}
              valueStyle={{ color: '#1890ff' }}
              prefix={<StarOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="参与项目"
              value={summary.project_count}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* 功分说明 */}
      <Alert
        message="功分计算说明"
        description={
          <div>
            <Paragraph>
              功分是基于协作贡献制度的量化评估指标，根据参与人数采用不同的计算公式：
            </Paragraph>
            <ul>
              <li><strong>双人协作</strong>：根据贡献差异进行调整</li>
              <li><strong>小组协作(3-10人)</strong>：综合考虑权重因子和调整因子</li>
              <li><strong>大组协作(10+人)</strong>：使用分布因子和对数调整因子</li>
            </ul>
          </div>
        }
        type="info"
        showIcon
        style={{ marginBottom: '24px' }}
      />

      {/* 项目功分统计 */}
      <Card
        title={
          <Space>
            <ProjectOutlined />
            项目功分统计
          </Space>
        }
        style={{ marginBottom: '24px' }}
      >
        <Table
          columns={projectColumns}
          dataSource={project_stats}
          rowKey="project_id"
          expandable={{
            expandedRowRender,
            expandRowByClick: true
          }}
          pagination={false}
          locale={{
            emptyText: '暂无项目功分数据'
          }}
        />
      </Card>

      {/* 最近贡献记录 */}
      <Card
        title={
          <Space>
            <ClockCircleOutlined />
            最近贡献记录
          </Space>
        }
      >
        {recent_contributions.length > 0 ? (
          <Timeline>
            {recent_contributions.map((contribution) => (
              <Timeline.Item
                key={contribution.id}
                color="green"
              >
                <div>
                  <Text strong>{contribution.task_title}</Text>
                  <br />
                  <Space>
                    <Tag color="blue">{contribution.contribution_type}</Tag>
                    <Text>分数: {contribution.score}</Text>
                    <Text>加权分数: {contribution.weighted_score?.toFixed(2)}</Text>
                    <Text type="secondary">记录者: {contribution.recorder}</Text>
                  </Space>
                  <br />
                  <Text type="secondary">
                    {dayjs(contribution.created_at).format('YYYY-MM-DD HH:mm')}
                  </Text>
                </div>
              </Timeline.Item>
            ))}
          </Timeline>
        ) : (
          <Empty
            description="暂无贡献记录"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        )}
      </Card>
    </div>
  );
};

export default UserMeritSummary;