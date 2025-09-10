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
    Layout,
    Menu,
    Tabs
} from 'antd';
import {
    BarChartOutlined,
    TrophyOutlined,
    StarOutlined,
    UserOutlined,
    RocketOutlined,
    ReloadOutlined,
    ProjectOutlined,
    HomeOutlined,
    CheckCircleOutlined,
    DollarOutlined,
    LoginOutlined,
    LogoutOutlined,
    SettingOutlined,
    BellOutlined,
    MessageOutlined,
    FileTextOutlined,
    PieChartOutlined,
    LineChartOutlined,
    RadarChartOutlined,
    AreaChartOutlined,
    AppstoreOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
    PieChart, Pie, Cell, 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
    LineChart, Line, AreaChart, Area,
    RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
    ComposedChart, ScatterChart, Scatter
} from 'recharts';
import LoginPrompt from '../Auth/LoginPrompt';
import useAuthStore from '../../stores/authStore';
import { wislabApi } from '../../services/api';
import './DataAnalysis.css';

const { Title, Text } = Typography;
const { Option } = Select;
const { Sider, Content } = Layout;
const { TabPane } = Tabs;

const DataAnalysis = () => {
    const [analysisData, setAnalysisData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showLoginPrompt, setShowLoginPrompt] = useState(false);
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState(null);
    const [collapsed, setCollapsed] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');

    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout, isAuthenticated } = useAuthStore();

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

    const handleLogout = async () => {
        await logout();
        navigate('/');
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
            userStats: {
                participatedProjects: 5,
                activeProjects: 3,
                completedProjects: 2,
                avgContribution: 85
            },
            projectContributions: [
                { name: '智能实验室管理系统', contribution: 85, progress: 75, status: 'active' },
                { name: '学生成绩分析平台', contribution: 70, progress: 60, status: 'active' },
                { name: '项目管理工具', contribution: 90, progress: 100, status: 'completed' },
                { name: '数据分析平台', contribution: 80, progress: 100, status: 'completed' }
            ],
            contributionDetails: [
                { type: '任务完成', value: 85, color: '#52c41a' },
                { type: '代码贡献', value: 78, color: '#1890ff' },
                { type: '文档编写', value: 92, color: '#722ed1' },
                { type: '团队协作', value: 88, color: '#fa8c16' },
                { type: '测试验证', value: 75, color: '#13c2c2' }
            ],
            monthlyTrends: [
                { month: '1月', contribution: 65, tasks: 12, projects: 2 },
                { month: '2月', contribution: 72, tasks: 18, projects: 3 },
                { month: '3月', contribution: 78, tasks: 25, projects: 3 },
                { month: '4月', contribution: 85, tasks: 30, projects: 4 },
                { month: '5月', contribution: 82, tasks: 28, projects: 4 },
                { month: '6月', contribution: 88, tasks: 35, projects: 5 }
            ],
            skillRadar: [
                { skill: '前端开发', value: 85, fullMark: 100 },
                { skill: '后端开发', value: 78, fullMark: 100 },
                { skill: '数据库设计', value: 72, fullMark: 100 },
                { skill: '项目管理', value: 88, fullMark: 100 },
                { skill: '团队协作', value: 92, fullMark: 100 },
                { skill: '文档编写', value: 80, fullMark: 100 }
            ],
            weeklyHeatmap: [
                { day: '周一', hour: 9, value: 85 }, { day: '周一', hour: 10, value: 90 },
                { day: '周二', hour: 9, value: 78 }, { day: '周二', hour: 10, value: 82 },
                { day: '周三', hour: 9, value: 92 }, { day: '周三', hour: 10, value: 88 },
                { day: '周四', hour: 9, value: 75 }, { day: '周四', hour: 10, value: 80 },
                { day: '周五', hour: 9, value: 85 }, { day: '周五', hour: 10, value: 90 }
            ],
            teamComparison: [
                { name: '个人', taskCompletion: 85, codeQuality: 78, documentation: 92, collaboration: 88 },
                { name: '团队平均', taskCompletion: 72, codeQuality: 75, documentation: 68, collaboration: 82 }
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
        } else if (key.startsWith('/')) {
            navigate(key);
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

    // 渲染概览统计卡片
    const renderOverviewStats = () => (
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
            <Col xs={12} sm={6}>
                <Card>
                    <Statistic
                        title="参与项目数"
                        value={analysisData?.userStats?.participatedProjects || 5}
                        prefix={<ProjectOutlined />}
                        valueStyle={{ color: '#3f8600' }}
                    />
                </Card>
            </Col>
            <Col xs={12} sm={6}>
                <Card>
                    <Statistic
                        title="进行中项目"
                        value={analysisData?.userStats?.activeProjects || 3}
                        prefix={<RocketOutlined />}
                        valueStyle={{ color: '#1890ff' }}
                    />
                </Card>
            </Col>
            <Col xs={12} sm={6}>
                <Card>
                    <Statistic
                        title="已完成项目"
                        value={analysisData?.userStats?.completedProjects || 2}
                        prefix={<TrophyOutlined />}
                        valueStyle={{ color: '#722ed1' }}
                    />
                </Card>
            </Col>
            <Col xs={12} sm={6}>
                <Card>
                    <Statistic
                        title="平均贡献度"
                        value={analysisData?.userStats?.avgContribution || 85}
                        suffix="%"
                        prefix={<StarOutlined />}
                        valueStyle={{ color: '#fa8c16' }}
                    />
                </Card>
            </Col>
        </Row>
    );

    // 渲染项目贡献度雷达图
    const renderProjectRadarChart = () => (
        <Card title="项目贡献度雷达图" extra={<RadarChartOutlined />}>
            <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={analysisData?.projectContributions}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="name" />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                    <Radar
                        name="贡献度"
                        dataKey="contribution"
                        stroke="#8884d8"
                        fill="#8884d8"
                        fillOpacity={0.6}
                    />
                    <RechartsTooltip />
                </RadarChart>
            </ResponsiveContainer>
        </Card>
    );

    // 渲染月度趋势折线图
    const renderMonthlyTrendChart = () => (
        <Card title="月度贡献度趋势" extra={<LineChartOutlined />}>
            <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={analysisData?.monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <RechartsTooltip />
                    <Legend />
                    <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="contribution"
                        stroke="#8884d8"
                        name="贡献度(%)"
                        strokeWidth={3}
                    />
                    <Bar
                        yAxisId="right"
                        dataKey="tasks"
                        fill="#82ca9d"
                        name="任务数量"
                    />
                </ComposedChart>
            </ResponsiveContainer>
        </Card>
    );

    // 渲染技能雷达图
    const renderSkillRadarChart = () => (
        <Card title="技能评估雷达图" extra={<RadarChartOutlined />}>
            <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={analysisData?.skillRadar}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="skill" />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                    <Radar
                        name="技能水平"
                        dataKey="value"
                        stroke="#1890ff"
                        fill="#1890ff"
                        fillOpacity={0.6}
                    />
                    <RechartsTooltip />
                </RadarChart>
            </ResponsiveContainer>
        </Card>
    );

    // 渲染团队对比图
    const renderTeamComparisonChart = () => (
        <Card title="与团队平均水平对比" extra={<BarChartOutlined />}>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analysisData?.teamComparison}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Bar dataKey="taskCompletion" fill="#52c41a" name="任务完成" />
                    <Bar dataKey="codeQuality" fill="#1890ff" name="代码质量" />
                    <Bar dataKey="documentation" fill="#722ed1" name="文档编写" />
                    <Bar dataKey="collaboration" fill="#fa8c16" name="团队协作" />
                </BarChart>
            </ResponsiveContainer>
        </Card>
    );

    // 渲染贡献度分布饼图
    const renderContributionPieChart = () => (
        <Card title="贡献度分布" extra={<PieChartOutlined />}>
            <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                    <Pie
                        dataKey="value"
                        data={analysisData?.contributionDetails}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        fill="#8884d8"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                        {analysisData?.contributionDetails?.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Pie>
                    <RechartsTooltip />
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
        </Card>
    );

    // 渲染项目进度面积图
    const renderProjectProgressAreaChart = () => (
        <Card title="项目进度累积效果" extra={<AreaChartOutlined />}>
            <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={analysisData?.projectContributions}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <RechartsTooltip />
                    <Area
                        type="monotone"
                        dataKey="progress"
                        stackId="1"
                        stroke="#8884d8"
                        fill="#8884d8"
                        fillOpacity={0.6}
                        name="项目进度"
                    />
                    <Area
                        type="monotone"
                        dataKey="contribution"
                        stackId="2"
                        stroke="#82ca9d"
                        fill="#82ca9d"
                        fillOpacity={0.6}
                        name="个人贡献"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </Card>
    );

    if (!analysisData) {
        return (
            <Layout className="analysis-layout">
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
                        <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
                            <Title level={2} style={{ margin: 0 }}>数据分析系统</Title>
                            {renderAnalysisActions()}
                        </Row>
                        <Card>
                            <Empty description="正在加载分析数据..." />
                        </Card>
                    </Content>
                </Layout>
            </Layout>
        );
    }

    return (
        <Layout className="analysis-layout">
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
                                <BarChartOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
                                我的贡献度分析
                            </Title>
                            {renderAnalysisActions()}
                        </Row>
                    </div>

                    {/* 概览统计 */}
                    {renderOverviewStats()}

                    {/* 图表分析区域 */}
                    <Card>
                        <Tabs activeKey={activeTab} onChange={setActiveTab}>
                            <TabPane tab="概览分析" key="overview">
                                <Row gutter={[16, 16]}>
                                    <Col xs={24} lg={12}>
                                        {renderContributionPieChart()}
                                    </Col>
                                    <Col xs={24} lg={12}>
                                        {renderMonthlyTrendChart()}
                                    </Col>
                                </Row>
                            </TabPane>
                            
                            <TabPane tab="项目分析" key="projects">
                                <Row gutter={[16, 16]}>
                                    <Col xs={24} lg={12}>
                                        {renderProjectRadarChart()}
                                    </Col>
                                    <Col xs={24} lg={12}>
                                        {renderProjectProgressAreaChart()}
                                    </Col>
                                </Row>
                            </TabPane>
                            
                            <TabPane tab="技能分析" key="skills">
                                <Row gutter={[16, 16]}>
                                    <Col xs={24} lg={12}>
                                        {renderSkillRadarChart()}
                                    </Col>
                                    <Col xs={24} lg={12}>
                                        {renderTeamComparisonChart()}
                                    </Col>
                                </Row>
                            </TabPane>
                        </Tabs>
                    </Card>
                </Content>
            </Layout>

            {/* 登录提示 */}
            <LoginPrompt
                visible={showLoginPrompt}
                onClose={() => setShowLoginPrompt(false)}
                message="请登录后使用数据分析管理功能"
            />
        </Layout>
    );
};

export default DataAnalysis;