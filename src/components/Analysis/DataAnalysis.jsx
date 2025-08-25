import React, { useState, useEffect } from 'react';
import {
    Card,
    Row,
    Col,
    Statistic,
    Table,
    Progress,
    Typography,
    Space,
    Tag,
    Button,
    Tooltip,
    Alert,
    List,
    Avatar,
    Divider,
    Select,
    Empty,
} from 'antd';
import {
    BarChartOutlined,
    TrophyOutlined,
    StarOutlined,
    UserOutlined,
    RocketOutlined,
    ReloadOutlined,
    ProjectOutlined
} from '@ant-design/icons';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import LoginPrompt from '../Auth/LoginPrompt';
import useAuthStore from '../../stores/authStore';
import { wislabApi } from '../../services/api';

const { Title, Text } = Typography;
const { Option } = Select;

const DataAnalysis = () => {
    const [analysisData, setAnalysisData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showLoginPrompt, setShowLoginPrompt] = useState(false);
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState(null);

    const { isAuthenticated } = useAuthStore();

    useEffect(() => {
        // 无论是否登录都获取数据
        fetchProjects();
        loadMockAnalysisData();
    }, []);

    useEffect(() => {
        if (selectedProject) {
            fetchAnalysisData();
        }
    }, [selectedProject]);

    const handleLoginRequired = () => {
        setShowLoginPrompt(true);
    };

    // 模拟获取项目数据
    const fetchProjects = async () => {
        try {
            setProjects([
                { id: 1, name: '智能实验室管理系统' },
                { id: 2, name: '学生成绩分析平台' },
                { id: 3, name: '项目管理工具' }
            ]);
        } catch (error) {
            console.error('获取项目失败:', error);
        }
    };

    // 加载模拟分析数据
    const loadMockAnalysisData = () => {
        setAnalysisData({
            projectStats: {
                totalProjects: 12,
                activeProjects: 8,
                completedProjects: 4,
                totalMembers: 25
            },
            memberContributions: [
                { name: '张三', contributions: 85, projects: 3 },
                { name: '李四', contributions: 72, projects: 2 },
                { name: '王五', contributions: 68, projects: 4 },
                { name: '赵六', contributions: 65, projects: 2 }
            ],
            projectProgress: [
                { name: '智能实验室', progress: 85, members: 6 },
                { name: '成绩分析平台', progress: 72, members: 4 },
                { name: '管理工具', progress: 68, members: 5 },
                { name: '数据可视化', progress: 45, members: 3 }
            ],
            taskDistribution: [
                { name: '开发任务', value: 45, color: '#8884d8' },
                { name: '测试任务', value: 25, color: '#82ca9d' },
                { name: '设计任务', value: 20, color: '#ffc658' },
                { name: '文档任务', value: 10, color: '#ff7c7c' }
            ],
            monthlyTrends: [
                { month: '1月', projects: 2, members: 8 },
                { month: '2月', projects: 3, members: 12 },
                { month: '3月', projects: 4, members: 18 },
                { month: '4月', projects: 5, members: 20 },
                { month: '5月', projects: 6, members: 25 }
            ]
        });
    };

    const fetchAnalysisData = async () => {
        if (!selectedProject) return;
        
        setLoading(true);
        try {
            // 这里应该是实际的API调用
            // 模拟数据加载
            setTimeout(() => {
                loadMockAnalysisData();
                setLoading(false);
            }, 1000);
        } catch (error) {
            console.error('获取分析数据失败:', error);
            setLoading(false);
        }
    };

    // 根据登录状态显示不同的按钮和操作
    const renderAnalysisActions = () => {
        if (!isAuthenticated()) {
            return (
                <Space>
                    <Button onClick={handleLoginRequired}>
                        登录后管理分析
                    </Button>
                </Space>
            );
        }

        return (
            <Space>
                <Select
                    placeholder="选择项目进行分析"
                    style={{ width: 200 }}
                    onChange={setSelectedProject}
                    value={selectedProject}
                >
                    {projects.map(project => (
                        <Option key={project.id} value={project.id}>
                            {project.name}
                        </Option>
                    ))}
                </Select>
                <Button 
                    icon={<ReloadOutlined />}
                    onClick={fetchAnalysisData}
                    disabled={!selectedProject}
                    loading={loading}
                >
                    刷新分析
                </Button>
            </Space>
        );
    };

    if (!analysisData) {
        return (
            <div style={{ padding: '24px' }}>
                <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
                    <Title level={2} style={{ margin: 0 }}>数据分析系统</Title>
                    {renderAnalysisActions()}
                </Row>
                <Card>
                    <Empty description="正在加载分析数据..." />
                </Card>
            </div>
        );
    }

    return (
        <div style={{ padding: '24px' }}>
            <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
                <Title level={2} style={{ margin: 0 }}>数据分析系统</Title>
                {renderAnalysisActions()}
            </Row>

            {/* 概览统计 */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col span={6}>
                    <Card>
                        <Statistic
                            title="总项目数"
                            value={analysisData.projectStats.totalProjects}
                            prefix={<ProjectOutlined />}
                            valueStyle={{ color: '#3f8600' }}
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <Statistic
                            title="进行中项目"
                            value={analysisData.projectStats.activeProjects}
                            prefix={<RocketOutlined />}
                            valueStyle={{ color: '#1890ff' }}
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <Statistic
                            title="已完成项目"
                            value={analysisData.projectStats.completedProjects}
                            prefix={<TrophyOutlined />}
                            valueStyle={{ color: '#722ed1' }}
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <Statistic
                            title="团队成员数"
                            value={analysisData.projectStats.totalMembers}
                            prefix={<UserOutlined />}
                            valueStyle={{ color: '#fa8c16' }}
                        />
                    </Card>
                </Col>
            </Row>

            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                {/* 成员贡献排行 */}
                <Col span={12}>
                    <Card title="成员贡献排行" extra={<StarOutlined />}>
                        <List
                            dataSource={analysisData.memberContributions}
                            renderItem={(member, index) => (
                                <List.Item>
                                    <List.Item.Meta
                                        avatar={<Avatar icon={<UserOutlined />} />}
                                        title={
                                            <Space>
                                                <Text strong>{member.name}</Text>
                                                <Tag color={index < 3 ? 'gold' : 'blue'}>
                                                    #{index + 1}
                                                </Tag>
                                            </Space>
                                        }
                                        description={
                                            <Space direction="vertical" size="small" style={{ width: '100%' }}>
                                                <div>
                                                    <Text type="secondary">贡献度: </Text>
                                                    <Progress 
                                                        percent={member.contributions} 
                                                        size="small" 
                                                        showInfo={false}
                                                    />
                                                    <Text strong>{member.contributions}%</Text>
                                                </div>
                                                <Text type="secondary">参与项目: {member.projects} 个</Text>
                                            </Space>
                                        }
                                    />
                                </List.Item>
                            )}
                        />
                    </Card>
                </Col>

                {/* 项目进度概览 */}
                <Col span={12}>
                    <Card title="项目进度概览" extra={<BarChartOutlined />}>
                        <List
                            dataSource={analysisData.projectProgress}
                            renderItem={(project) => (
                                <List.Item>
                                    <div style={{ width: '100%' }}>
                                        <Row justify="space-between" align="middle">
                                            <Col>
                                                <Text strong>{project.name}</Text>
                                            </Col>
                                            <Col>
                                                <Space>
                                                    <Tag color="blue">{project.members} 人</Tag>
                                                    <Text>{project.progress}%</Text>
                                                </Space>
                                            </Col>
                                        </Row>
                                        <Progress 
                                            percent={project.progress} 
                                            strokeColor={
                                                project.progress >= 80 ? '#52c41a' : 
                                                project.progress >= 60 ? '#1890ff' : 
                                                project.progress >= 40 ? '#fa8c16' : '#f5222d'
                                            }
                                            showInfo={false}
                                            style={{ marginTop: 8 }}
                                        />
                                    </div>
                                </List.Item>
                            )}
                        />
                    </Card>
                </Col>
            </Row>

            <Row gutter={[16, 16]}>
                {/* 任务分布饼图 */}
                <Col span={12}>
                    <Card title="任务类型分布">
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    dataKey="value"
                                    data={analysisData.taskDistribution}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={100}
                                    fill="#8884d8"
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                >
                                    {analysisData.taskDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <RechartsTooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </Card>
                </Col>

                {/* 月度趋势柱状图 */}
                <Col span={12}>
                    <Card title="月度发展趋势">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={analysisData.monthlyTrends}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis />
                                <RechartsTooltip />
                                <Legend />
                                <Bar dataKey="projects" fill="#8884d8" name="项目数量" />
                                <Bar dataKey="members" fill="#82ca9d" name="团队成员" />
                            </BarChart>
                        </ResponsiveContainer>
                    </Card>
                </Col>
            </Row>

            {/* 登录提示 */}
            <LoginPrompt
                visible={showLoginPrompt}
                onClose={() => setShowLoginPrompt(false)}
                message="请登录后使用数据分析管理功能"
            />
        </div>
    );
};

export default DataAnalysis;