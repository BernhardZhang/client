import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
    Row,
    Col,
    Card,
    Button,
    Breadcrumb,
    Space,
    Typography,
    message,
    Spin,
    Alert,
} from 'antd';
import {
    ArrowLeftOutlined,
    ProjectOutlined,
    SettingOutlined,
    BarChartOutlined,
} from '@ant-design/icons';
import useProjectStore from '../../stores/projectStore';
import useAuthStore from '../../stores/authStore';
import ProjectTasks from './Tasks';
import TaskBasedEvaluation from './TaskBasedEvaluation';

const { Title } = Typography;

const TasksPage = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [activeSection, setActiveSection] = useState('tasks');
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);

    const { fetchProject } = useProjectStore();
    const { user } = useAuthStore();

    useEffect(() => {
        if (projectId) {
            loadProject();
        }
    }, [projectId]);

    useEffect(() => {
        // 从URL参数获取section
        const section = searchParams.get('section');
        if (section && (section === 'tasks' || section === 'evaluation')) {
            setActiveSection(section);
        }
    }, [searchParams]);

    const loadProject = async () => {
        try {
            setLoading(true);
            const result = await fetchProject(projectId);
            if (result && result.success !== false) {
                setProject(result.data || result);
            } else {
                message.error('项目加载失败');
                navigate('/projects');
            }
        } catch (error) {
            console.error('加载项目失败:', error);
            message.error('项目加载失败');
            navigate('/projects');
        } finally {
            setLoading(false);
        }
    };

    const isProjectOwner = () => {
        if (!project || !user) return false;
        return project.owner === user.id;
    };

    const isProjectMember = () => {
        if (!project || !user) return false;
        return project.members_detail?.some(member => member.user === user.id);
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '50px' }}>
                <Spin size="large" />
            </div>
        );
    }

    if (!project) {
        return (
            <Alert
                message="项目不存在"
                description="您访问的项目不存在或已被删除。"
                type="error"
                showIcon
                action={
                    <Button onClick={() => navigate('/projects')}>
                        返回项目列表
                    </Button>
                }
            />
        );
    }

    const menuItems = [
        {
            key: 'tasks',
            icon: <ProjectOutlined />,
            label: '项目任务',
        },
        {
            key: 'evaluation',
            icon: <BarChartOutlined />,
            label: '功分互评',
        },
    ];

    return (
        <div>
            {/* 面包屑导航 */}
            <Row style={{ marginBottom: 16 }}>
                <Col span={24}>
                    <Breadcrumb>
                        <Breadcrumb.Item>
                            <Button
                                type="link"
                                icon={<ArrowLeftOutlined />}
                                onClick={() => navigate('/projects')}
                                style={{ padding: 0 }}
                            >
                                项目管理
                            </Button>
                        </Breadcrumb.Item>
                        <Breadcrumb.Item>{project.name}</Breadcrumb.Item>
                        <Breadcrumb.Item>
                            {activeSection === 'tasks' ? '项目任务' : '功分互评'}
                        </Breadcrumb.Item>
                    </Breadcrumb>
                </Col>
            </Row>

            {/* 项目标题和操作栏 */}
            <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
                <Col>
                    <Title level={2} style={{ margin: 0 }}>
                        {project.name} - {activeSection === 'tasks' ? '项目任务' : '功分互评'}
                    </Title>
                </Col>
                <Col>
                    <Space>
                        {menuItems.map(item => (
                            <Button
                                key={item.key}
                                type={activeSection === item.key ? 'primary' : 'default'}
                                icon={item.icon}
                                onClick={() => setActiveSection(item.key)}
                            >
                                {item.label}
                            </Button>
                        ))}
                        {isProjectOwner() && (
                            <Button
                                icon={<SettingOutlined />}
                                onClick={() => message.info('项目设置功能待实现')}
                            >
                                项目设置
                            </Button>
                        )}
                    </Space>
                </Col>
            </Row>

            {/* 内容区域 */}
            <Card>
                {activeSection === 'tasks' && (
                    <ProjectTasks
                        projectId={projectId}
                        project={project}
                        isProjectOwner={isProjectOwner()}
                    />
                )}
                {activeSection === 'evaluation' && (
                    <TaskBasedEvaluation
                        projectId={projectId}
                        project={project}
                        isProjectOwner={isProjectOwner()}
                    />
                )}
            </Card>
        </div>
    );
};

export default TasksPage;