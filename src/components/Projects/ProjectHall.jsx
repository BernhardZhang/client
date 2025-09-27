import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Avatar,
  Typography,
  message,
  Empty,
  Row,
  Col,
  Statistic,
  Input,
  Select,
  Tooltip,
  Badge,
  Modal,
  Descriptions,
  Pagination,
  Layout,
  Menu,
  Divider,
  List,
  Timeline,
  Progress,
  InputNumber,
  Slider,
  Checkbox
} from 'antd';
import {
  ShopOutlined,
  UserOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  FlagOutlined,
  ProjectOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  SearchOutlined,
  FilterOutlined,
  ReloadOutlined,
  HomeOutlined,
  DollarOutlined,
  LoginOutlined,
  LogoutOutlined,
  SettingOutlined,
  BellOutlined,
  MessageOutlined,
  FileTextOutlined,
  StarOutlined,
  BarChartOutlined,
  TeamOutlined,
  TrophyOutlined,
  AppstoreOutlined,
  FireOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import dayjs from 'dayjs';
import LoginPrompt from '../Auth/LoginPrompt';
import useAuthStore from '../../stores/authStore';
import useProjectStore from '../../stores/projectStore';
import useTaskStore from '../../stores/taskStore';
import cozeService from '../../services/cozeService';
import api from '../../services/api';
import './ProjectHall.css';

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;
const { Option } = Select;
const { Sider, Content } = Layout;

const ProjectHall = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 12,
    total: 0
  });
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    category: 'all'
  });
  const [viewingProject, setViewingProject] = useState(null);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [projectDetail, setProjectDetail] = useState(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [viewMode, setViewMode] = useState('card');
  const [isInvestModalVisible, setIsInvestModalVisible] = useState(false);
  const [investProject, setInvestProject] = useState(null);
  const [investAmount, setInvestAmount] = useState(0);
  const [agreeRisk, setAgreeRisk] = useState(false);
  const [investSubmitting, setInvestSubmitting] = useState(false);
  const [aiAnalysisResults, setAiAnalysisResults] = useState({}); // 存储AI分析结果
  const [projectAnalysisState, setProjectAnalysisState] = useState('');
  const [projectAnalysisLoading, setProjectAnalysisLoading] = useState(true);
  const [teamCollaborationState, setTeamCollaborationState] = useState('');
  const [teamCollaborationLoading, setTeamCollaborationLoading] = useState(true);
  const [taskOverviewAnalysisState, setTaskOverviewAnalysisState] = useState('');
  const [taskOverviewAnalysisLoading, setTaskOverviewAnalysisLoading] = useState(true);

  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAuthenticated, updateProfile } = useAuthStore();
  const { fetchProjects } = useProjectStore();
  const { tasks, fetchTasks } = useTaskStore();

  // 获取公开项目数据
  const fetchPublicProjects = async (page = 1, pageSize = 12) => {
    setLoading(true);
    try {
      // 直接调用后端的公开项目API
      console.log('Fetching public projects from API...');
      const response = await api.get('/projects/public/');
      console.log('Public projects response:', response.data);
      const publicProjects = response.data.results || response.data || [];
      
      console.log('Found public projects:', publicProjects.length);
      setProjects(publicProjects);
      setPagination(prev => ({
        ...prev,
        current: page,
        total: publicProjects.length
      }));
    } catch (error) {
      console.error('Error fetching public projects:', error);
      message.error('获取公开项目数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublicProjects();
    fetchTasks(); // 获取任务数据
  }, []);

  // Handle AI analysis when viewing project changes
  useEffect(() => {
    if (viewingProject) {
      setProjectAnalysisLoading(true);
      setTeamCollaborationLoading(true);
      setTaskOverviewAnalysisLoading(true);

      getAIAnalysisResults(viewingProject.id)
        .then(results => {
          setProjectAnalysisState(results.projectAnalysis);
          setTeamCollaborationState(results.teamCollaboration);
          setTaskOverviewAnalysisState(results.taskOverviewAnalysis);
          setProjectAnalysisLoading(false);
          setTeamCollaborationLoading(false);
          setTaskOverviewAnalysisLoading(false);
        })
        .catch(error => {
          console.error('获取AI分析失败:', error);
          const tasksOverview = getTasksOverview(viewingProject.id);
          setProjectAnalysisState(generateProjectAnalysis(viewingProject, tasksOverview));
          setTeamCollaborationState(generateTeamCollaboration(viewingProject, tasksOverview));
          setTaskOverviewAnalysisState(generateTaskOverviewAnalysis(viewingProject, tasksOverview));
          setProjectAnalysisLoading(false);
          setTeamCollaborationLoading(false);
          setTaskOverviewAnalysisLoading(false);
        });
    }
  }, [viewingProject?.id]);

  // 添加一个刷新公开项目的处理函数
  const handleRefreshProjects = () => {
    fetchPublicProjects();
  };

  // 计算项目的任务进度 - 与Projects.jsx保持一致
  const calculateTasksProgress = (projectId) => {
    if (!Array.isArray(tasks)) {
      return 0;
    }

    const projectTasks = tasks.filter(task => task.project === projectId);
    const totalProgress = projectTasks.reduce((total, task) => {
      return total + (task.progress || 0);
    }, 0);

    return Math.min(totalProgress, 100);
  };

  // 计算项目的团队成员总数（任务参与者并集）
  const calculateTeamMembersCount = (projectId) => {
    if (!Array.isArray(tasks)) {
      return 0;
    }

    const projectTasks = tasks.filter(task => task.project === projectId);
    const memberIds = new Set();

    projectTasks.forEach(task => {
      if (task.assignee) {
        memberIds.add(task.assignee);
      }
      if (task.participants && Array.isArray(task.participants)) {
        task.participants.forEach(participant => {
          memberIds.add(participant.id || participant);
        });
      }
    });

    return memberIds.size;
  };

  // 获取项目的任务概览数据
  const getTasksOverview = (projectId) => {
    if (!Array.isArray(tasks)) {
      return { tasks: [], completed: 0, total: 0 };
    }

    const projectTasks = tasks.filter(task => task.project === projectId);
    const completed = projectTasks.filter(task => task.status === 'completed').length;

    return {
      tasks: projectTasks,
      completed,
      total: projectTasks.length,
      percentage: projectTasks.length > 0 ? Math.round((completed / projectTasks.length) * 100) : 0
    };
  };

  // 生成AI分析内容
  const generateProjectAnalysis = (project, tasksOverview) => {
    const progress = calculateTasksProgress(project.id);
    const teamSize = calculateTeamMembersCount(project.id);

    let analysis = [];

    if (progress >= 80) {
      analysis.push("项目进度良好，即将完成。");
    } else if (progress >= 50) {
      analysis.push("项目进展顺利，已完成大部分工作。");
    } else if (progress >= 20) {
      analysis.push("项目正在积极推进中。");
    } else {
      analysis.push("项目刚刚起步，需要加快推进速度。");
    }

    if (teamSize >= 5) {
      analysis.push("团队规模较大，协作能力强。");
    } else if (teamSize >= 2) {
      analysis.push("团队规模适中，便于管理。");
    } else {
      analysis.push("团队规模较小，需要更多成员参与。");
    }

    if (tasksOverview.total > 10) {
      analysis.push("任务分解详细，项目规划清晰。");
    } else if (tasksOverview.total > 5) {
      analysis.push("任务规划合理，执行步骤明确。");
    } else {
      analysis.push("任务较少，可能需要进一步细分。");
    }

    return analysis.join(" ");
  };

  // 生成团队合作分析
  const generateTeamCollaboration = (project, tasksOverview) => {
    const teamSize = calculateTeamMembersCount(project.id);
    const completionRate = tasksOverview.percentage;

    let collaboration = [];

    if (completionRate >= 70) {
      collaboration.push("团队执行力强，任务完成效率高。");
    } else if (completionRate >= 40) {
      collaboration.push("团队协作良好，项目推进稳定。");
    } else {
      collaboration.push("团队需要加强协作，提高执行效率。");
    }

    if (teamSize >= 3) {
      collaboration.push("成员分工明确，协作配合默契。");
    } else {
      collaboration.push("团队成员较少，每个人承担多项职责。");
    }

    if (tasksOverview.total > 0) {
      const avgTasksPerMember = teamSize > 0 ? Math.round(tasksOverview.total / teamSize) : 0;
      if (avgTasksPerMember > 3) {
        collaboration.push("任务分配均衡，工作负荷适中。");
      } else if (avgTasksPerMember > 1) {
        collaboration.push("任务分配相对均衡。");
      } else {
        collaboration.push("部分成员可能承担更多工作。");
      }
    }

    return collaboration.join(" ");
  };

  // 获取进度条颜色配置 - 与Projects.jsx保持一致
  const getProgressStrokeColor = (tasksProgress) => {
    if (tasksProgress === 100) {
      return '#1890ff'; // 蓝色：项目完成
    }

    // 如果任务总和小于100%，显示分段颜色
    if (tasksProgress < 100) {
      return {
        '0%': '#52c41a',  // 绿色：任务完成部分
        [`${tasksProgress}%`]: '#52c41a',
        [`${tasksProgress + 0.1}%`]: '#faad14', // 黄色：未分配部分
        '100%': '#faad14'
      };
    }

    return '#52c41a'; // 绿色：任务完成部分
  };

  // 调用Coze进行项目分析
  const generateAIProjectAnalysis = async (project, tasksOverview) => {
    try {
      const projectData = {
        name: project.name,
        description: project.description,
        progress: calculateTasksProgress(project.id),
        teamSize: calculateTeamMembersCount(project.id),
        totalTasks: tasksOverview.total,
        completedTasks: tasksOverview.completed,
        completionRate: tasksOverview.percentage,
        status: project.status,
        tags: project.tags || []
      };

      console.log('开始Coze项目分析，项目数据:', projectData);

      // 构建分析提示
      const prompt = `请分析以下项目数据并提供专业的项目分析报告：

项目名称: ${projectData.name}
项目描述: ${projectData.description || '无描述'}
项目进度: ${projectData.progress}%
团队规模: ${projectData.teamSize}人
任务总数: ${projectData.totalTasks}个
已完成任务: ${projectData.completedTasks}个
完成率: ${projectData.completionRate}%
项目状态: ${projectData.status}
项目标签: ${projectData.tags.join(', ') || '无标签'}

请从以下角度提供分析：
1. 项目进度评估
2. 团队配置分析
3. 任务规划合理性
4. 项目风险识别
5. 改进建议

请用中文回复，控制在150字以内，语言简洁专业。`;

      let analysisResult = '';
      let conversationId = null;

      // 使用Coze API进行分析
      const result = await cozeService.chatStream(
        prompt,
        [],
        `user_${Date.now()}`,
        [],
        null,
        (deltaContent, isCompleted) => {
          if (deltaContent) {
            analysisResult += deltaContent;
          }
        }
      );

      conversationId = result.conversationId;
      console.log('Coze项目分析完成，对话ID:', conversationId);

      // 及时关闭对话
      if (conversationId) {
        try {
          await cozeService.cancelChat(conversationId, result.chatId);
          console.log('Coze项目分析对话已关闭');
        } catch (closeError) {
          console.warn('关闭Coze项目分析对话失败:', closeError);
        }
      }

      return analysisResult || '项目分析已完成，具体分析结果请查看详细报告。';

    } catch (error) {
      console.error('Coze项目分析失败:', error);
      // 如果Coze分析失败，返回基于规则的分析
      return generateProjectAnalysis(project, tasksOverview);
    }
  };

  // 调用Coze进行任务概览分析
  const generateAITaskOverviewAnalysis = async (project, tasksOverview) => {
    try {
      const taskData = {
        projectName: project.name,
        totalTasks: tasksOverview.total,
        completedTasks: tasksOverview.completed,
        completionRate: tasksOverview.percentage,
        taskDetails: tasksOverview.tasks.map(task => ({
          title: task.title,
          status: task.status,
          progress: task.progress || 0,
          priority: task.priority || '中',
          assignee: task.assignee_name || '未分配',
          dueDate: task.due_date || '未设置',
          description: task.description ? task.description.substring(0, 50) : '无描述'
        })).slice(0, 10) // 只分析前10个任务
      };

      console.log('开始Coze任务概览分析，任务数据:', taskData);

      const prompt = `请分析以下项目的任务概览数据：

项目名称: ${taskData.projectName}
任务总数: ${taskData.totalTasks}个
已完成任务: ${taskData.completedTasks}个
完成率: ${taskData.completionRate}%

主要任务详情:
${taskData.taskDetails.map((task, idx) =>
  `${idx + 1}. ${task.title} - 状态:${task.status === 'completed' ? '已完成' : task.status === 'in_progress' ? '进行中' : '待开始'}, 进度:${task.progress}%, 负责人:${task.assignee}`
).join('\n')}

请从以下角度分析任务执行情况：
1. 任务完成质量评估
2. 任务分配合理性
3. 执行进度健康度
4. 潜在瓶颈识别
5. 优化改进建议

请用中文回复，控制在120字以内，语言简洁专业。`;

      let analysisResult = '';
      let conversationId = null;

      // 使用Coze API进行分析
      const result = await cozeService.chatStream(
        prompt,
        [],
        `user_${Date.now()}`,
        [],
        null,
        (deltaContent, isCompleted) => {
          if (deltaContent) {
            analysisResult += deltaContent;
          }
        }
      );

      conversationId = result.conversationId;
      console.log('Coze任务概览分析完成，对话ID:', conversationId);

      // 及时关闭对话
      if (conversationId) {
        try {
          await cozeService.cancelChat(conversationId, result.chatId);
          console.log('Coze任务概览分析对话已关闭');
        } catch (closeError) {
          console.warn('关闭Coze任务概览分析对话失败:', closeError);
        }
      }

      return analysisResult || '任务概览分析已完成，项目任务执行情况良好。';

    } catch (error) {
      console.error('Coze任务概览分析失败:', error);
      // 如果Coze分析失败，返回基于规则的分析
      return generateTaskOverviewAnalysis(project, tasksOverview);
    }
  };

  // 生成基于规则的任务概览分析（作为fallback）
  const generateTaskOverviewAnalysis = (project, tasksOverview) => {
    const completionRate = tasksOverview.percentage;
    const totalTasks = tasksOverview.total;

    let analysis = [];

    if (totalTasks === 0) {
      analysis.push("项目尚未创建任务，建议尽快制定详细的任务计划。");
    } else if (completionRate >= 80) {
      analysis.push("任务执行进度优秀，团队执行力强。");
    } else if (completionRate >= 60) {
      analysis.push("任务完成情况良好，整体推进稳定。");
    } else if (completionRate >= 30) {
      analysis.push("任务执行进度中等，需要加强推进力度。");
    } else {
      analysis.push("任务完成率偏低，建议优化执行策略。");
    }

    if (totalTasks > 20) {
      analysis.push("任务分解细致，便于精确管理。");
    } else if (totalTasks > 10) {
      analysis.push("任务规划合理，管理难度适中。");
    } else if (totalTasks > 0) {
      analysis.push("任务数量较少，可能需要进一步细分。");
    }

    return analysis.join(" ");
  };
  const generateAITeamCollaboration = async (project, tasksOverview) => {
    try {
      const teamData = {
        teamSize: calculateTeamMembersCount(project.id),
        totalTasks: tasksOverview.total,
        completedTasks: tasksOverview.completed,
        completionRate: tasksOverview.percentage,
        taskDistribution: tasksOverview.tasks.map(task => ({
          title: task.title,
          status: task.status,
          progress: task.progress,
          hasAssignee: !!task.assignee
        }))
      };

      console.log('开始Coze团队合作分析，团队数据:', teamData);

      const prompt = `请分析以下团队协作数据：

项目名称: ${project.name}
团队规模: ${teamData.teamSize}人
任务总数: ${teamData.totalTasks}个
已完成任务: ${teamData.completedTasks}个
完成率: ${teamData.completionRate}%

任务分配情况:
${formatTaskDistribution(teamData.taskDistribution)}

请从以下角度分析团队协作情况：
1. 团队执行力评估
2. 任务分配合理性
3. 协作效率分析
4. 团队建设建议

请用中文回复，控制在120字以内，语言简洁专业。`;

      let analysisResult = '';
      let conversationId = null;

      // 使用Coze API进行分析
      const result = await cozeService.chatStream(
        prompt,
        [],
        `user_${Date.now()}`,
        [],
        null,
        (deltaContent, isCompleted) => {
          if (deltaContent) {
            analysisResult += deltaContent;
          }
        }
      );

      conversationId = result.conversationId;
      console.log('Coze团队分析完成，对话ID:', conversationId);

      // 及时关闭对话
      if (conversationId) {
        try {
          await cozeService.cancelChat(conversationId, result.chatId);
          console.log('Coze团队分析对话已关闭');
        } catch (closeError) {
          console.warn('关闭Coze团队分析对话失败:', closeError);
        }
      }

      return analysisResult || '团队合作分析已完成，具体分析结果请查看详细报告。';

    } catch (error) {
      console.error('Coze团队分析失败:', error);
      // 如果Coze分析失败，返回基于规则的分析
      return generateTeamCollaboration(project, tasksOverview);
    }
  };

  // 格式化任务分配情况
  const formatTaskDistribution = (taskList) => {
    if (!taskList || taskList.length === 0) {
      return "暂无任务分配数据";
    }

    const statusCount = {
      'completed': taskList.filter(t => t.status === 'completed').length,
      'in_progress': taskList.filter(t => t.status === 'in_progress').length,
      'pending': taskList.filter(t => t.status === 'pending').length
    };

    const assignedCount = taskList.filter(t => t.hasAssignee).length;

    return `已完成: ${statusCount.completed}个, 进行中: ${statusCount.in_progress}个, 待开始: ${statusCount.pending}个, 已分配: ${assignedCount}个`;
  };

  // 获取或生成AI分析结果
  const getAIAnalysisResults = async (projectId) => {
    if (aiAnalysisResults[projectId]) {
      return aiAnalysisResults[projectId];
    }

    const project = projects.find(p => p.id === projectId) || viewingProject;
    const tasksOverview = getTasksOverview(projectId);

    console.log('为项目ID', projectId, '生成AI分析');

    const [projectAnalysis, teamCollaboration, taskOverviewAnalysis] = await Promise.all([
      generateAIProjectAnalysis(project, tasksOverview),
      generateAITeamCollaboration(project, tasksOverview),
      generateAITaskOverviewAnalysis(project, tasksOverview)
    ]);

    const results = {
      projectAnalysis,
      teamCollaboration,
      taskOverviewAnalysis
    };

    setAiAnalysisResults(prev => ({
      ...prev,
      [projectId]: results
    }));

    return results;
  };

  const handleLoginRequired = () => {
    setShowLoginPrompt(true);
  };

  const handlePromptLogin = () => {
    setShowLoginPrompt(false);
    // 这里可以触发登录流程
  };

  const handlePromptRegister = () => {
    setShowLoginPrompt(false);
    // 这里可以触发注册流程
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
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
      key: '/project-hall',
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

  // 项目统计
  const projectStats = {
    total: projects.length,
    active: projects.filter(p => p.status === 'active').length,
    completed: projects.filter(p => p.status === 'completed').length,
    recruiting: projects.filter(p => p.status === 'recruiting').length,
    totalMembers: projects.reduce((sum, p) => sum + (p.members_count || 0), 0),
    totalTasks: projects.reduce((sum, p) => sum + (p.task_count || 0), 0)
  };

  // 最近项目
  const recentProjects = projects
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);

  // 热门项目
  const popularProjects = projects
    .sort((a, b) => (b.members_count || 0) - (a.members_count || 0))
    .slice(0, 5);

  const fetchProjectDetail = async (projectId) => {
    setDetailLoading(true);
    try {
      const res = await api.get(`/projects/${projectId}/`);
      setProjectDetail(res.data || null);
    } catch (e) {
      console.error('获取项目详情失败:', e);
      setProjectDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleViewProject = (project) => {
    setViewingProject(project);
    setIsDetailModalVisible(true);
    fetchProjectDetail(project.id);
  };

  const handleOpenInvest = async (project) => {
    if (!isAuthenticated()) {
      handleLoginRequired();
      return;
    }
    try {
      await updateProfile?.();
    } catch (e) {
      console.warn('刷新用户资料失败，继续打开投资弹窗');
    }
    setInvestProject(project);
    setInvestAmount(0);
    setAgreeRisk(false);
    setIsInvestModalVisible(true);
  };

  const handleSubmitInvest = async () => {
    if (!investProject) return;
    if (investAmount <= 0 || investAmount > 1) {
      message.warning('请输入0-1元之间的投资金额');
      return;
    }
    if (typeof user?.balance === 'number' && investAmount > user.balance) {
      message.error('可用额度不足');
      return;
    }
    if (!agreeRisk) {
      message.warning('请勾选风险提示与协议');
      return;
    }
    try {
      setInvestSubmitting(true);
      await api.post(`/projects/${investProject.id}/invest/`, { amount: Number(investAmount.toFixed(2)) });
      message.success('投资成功');
      setIsInvestModalVisible(false);
      setInvestProject(null);
    } catch (error) {
      console.error('投资失败:', error);
      message.error('投资失败，请稍后重试');
    } finally {
      setInvestSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'green';
      case 'completed': return 'blue';
      case 'recruiting': return 'orange';
      case 'pending': return 'default';
      default: return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return '进行中';
      case 'completed': return '已完成';
      case 'recruiting': return '招募中';
      case 'pending': return '待启动';
      default: return '未知';
    }
  };

  const columns = [
    {
      title: '项目信息',
      key: 'info',
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <Space>
            <Avatar size="small" icon={<ProjectOutlined />} />
            <Text strong>{record.name}</Text>
            <Tag color={getStatusColor(record.status)}>
              {getStatusText(record.status)}
            </Tag>
          </Space>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.description?.substring(0, 100)}...
          </Text>
        </Space>
      ),
    },
    {
      title: '进度',
      key: 'progress',
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <Progress 
            percent={record.progress || 0} 
            size="small" 
            status={record.status === 'completed' ? 'success' : 'active'}
          />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.completed_tasks || 0}/{record.task_count || 0} 任务
          </Text>
        </Space>
      ),
    },
    {
      title: '团队',
      key: 'team',
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <Space>
            <TeamOutlined />
            <Text>{record.members_count || 0} 成员</Text>
          </Space>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            投资人: {record.investor_count || record.investors_count || 0}
          </Text>
        </Space>
      ),
    },
    {
      title: '热度',
      key: 'heat',
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <Space>
            <FireOutlined style={{ color: '#ff4d4f' }} />
            <Text>{record.view_count || Math.floor(Math.random() * 1000) + 100}</Text>
          </Space>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            浏览热度
          </Text>
        </Space>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            type="link" 
            size="small" 
            icon={<EyeOutlined />}
            onClick={() => handleViewProject(record)}
          >
            查看
          </Button>
          <Button 
            type="primary" 
            size="small"
            onClick={() => handleOpenInvest(record)}
          >
            投资项目
          </Button>
        </Space>
      ),
    },
  ];

  const renderProjectCard = (project) => (
    <Col xs={24} sm={12} lg={8} xl={6} key={project.id}>
      <Card
        hoverable
        actions={[
          <Button 
            type="link" 
            size="small" 
            icon={<EyeOutlined />}
            onClick={() => handleViewProject(project)}
          >
            查看详情
          </Button>,
          <Button 
            type="primary" 
            size="small"
            onClick={() => handleOpenInvest(project)}
          >
            投资项目
          </Button>
        ]}
      >
        <Card.Meta
          avatar={<Avatar size="large" icon={<ProjectOutlined />} />}
          title={
            <Space>
              <Text strong>{project.name}</Text>
              <Tag color={getStatusColor(project.status)}>
                {getStatusText(project.status)}
              </Tag>
            </Space>
          }
          description={
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {project.description?.substring(0, 80)}...
              </Text>
              <Progress 
                percent={project.progress || 0} 
                size="small" 
                status={project.status === 'completed' ? 'success' : 'active'}
              />
              <Row gutter={8}>
                <Col span={6}>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    <TeamOutlined /> {project.members_count || 0} 成员
                  </Text>
                </Col>
                <Col span={6}>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    <TrophyOutlined /> {project.task_count || 0} 任务
                  </Text>
                </Col>
                <Col span={6}>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    💼 {project.investor_count || project.investors_count || 0} 投资人
                  </Text>
                </Col>
                <Col span={6}>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    <FireOutlined /> {project.view_count || Math.floor(Math.random() * 1000) + 100} 浏览
                  </Text>
                </Col>
              </Row>
            </Space>
          }
        />
      </Card>
    </Col>
  );

  return (
    <Layout className="project-hall-layout">
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
                    onClick={handleLoginRequired}
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

      {/* 右侧内容区域 */}
      <Layout>
        <Content className="right-content" style={{ 
          padding: '24px', 
          overflow: 'auto'
        }}>
        {/* 顶部标题和搜索 */}
        <div style={{ marginBottom: '24px' }}>
          <Row justify="space-between" align="middle" style={{ marginBottom: '16px' }}>
            <Title level={2} style={{ margin: 0 }}>
              <AppstoreOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
              项目大厅
            </Title>
            <Space>
              <Select
                value={filters.status}
                onChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
                style={{ width: 120 }}
              >
                <Option value="all">全部状态</Option>
                <Option value="active">进行中</Option>
                <Option value="recruiting">招募中</Option>
                <Option value="completed">已完成</Option>
              </Select>
              <Button.Group>
                <Tooltip title="卡片视图">
                  <Button 
                    type={viewMode === 'card' ? 'primary' : 'default'} 
                    icon={<AppstoreOutlined />}
                    onClick={() => setViewMode('card')}
                  />
                </Tooltip>
                <Tooltip title="列表视图">
                  <Button 
                    type={viewMode === 'table' ? 'primary' : 'default'} 
                    icon={<BarChartOutlined />}
                    onClick={() => setViewMode('table')}
                  />
                </Tooltip>
              </Button.Group>
            </Space>
          </Row>

          {/* 搜索栏 */}
          <Row gutter={16} style={{ marginBottom: '16px' }}>
            <Col span={12}>
              <Search
                placeholder="搜索项目名称或描述"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                onSearch={(value) => setFilters(prev => ({ ...prev, search: value }))}
                enterButton
              />
            </Col>
          </Row>
        </div>

        {/* 统计数据 */}
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="公开项目"
                value={projectStats.total}
                prefix={<ProjectOutlined />}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="进行中项目"
                value={projectStats.active}
                prefix={<BarChartOutlined />}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="招募中项目"
                value={projectStats.recruiting}
                prefix={<TeamOutlined />}
                valueStyle={{ color: '#fa8c16' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="总成员数"
                value={projectStats.totalMembers}
                prefix={<UserOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
        </Row>

        {/* 项目列表 */}
        <Card>
          {viewMode === 'card' ? (
            <Row gutter={[16, 16]}>
              {projects.length > 0 ? (
                projects.map(renderProjectCard)
              ) : (
                <Col span={24}>
                  <Empty description="暂无公开项目" />
                </Col>
              )}
            </Row>
          ) : (
            <Table
              columns={columns}
              dataSource={projects}
              rowKey="id"
              loading={loading}
              pagination={{
                current: pagination.current,
                pageSize: pagination.pageSize,
                total: pagination.total,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
              }}
            />
          )}
        </Card>
        </Content>
      </Layout>
      
      <LoginPrompt
        visible={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        message="请登录后投资项目"
        onLogin={handlePromptLogin}
        onRegister={handlePromptRegister}
      />

      {/* 项目详情模态框 */
      }
      <Modal
        title="项目详情"
        open={isDetailModalVisible}
        onCancel={() => setIsDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsDetailModalVisible(false)}>
            关闭
          </Button>,
          <Button 
            key="invest" 
            type="primary"
            onClick={() => {
              setIsDetailModalVisible(false);
              handleOpenInvest(viewingProject);
            }}
          >
            投资项目
          </Button>
        ]}
        width={800}
      >
        {viewingProject && (
          <>
            <Descriptions column={2} bordered>
              <Descriptions.Item label="项目名称" span={2}>
                {viewingProject.name}
              </Descriptions.Item>
              <Descriptions.Item label="项目状态">
                <Tag color={getStatusColor(viewingProject.status)}>
                  {getStatusText(viewingProject.status)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="项目估值">
                {/* 项目估值暂时不填写 */}
                <Text type="secondary">待评估</Text>
              </Descriptions.Item>
              <Descriptions.Item label="项目描述" span={2}>
                {viewingProject.description}
              </Descriptions.Item>
              <Descriptions.Item label="团队成员">
                {/* 计算任务参与者并集 */}
                {calculateTeamMembersCount(viewingProject.id)} 人
              </Descriptions.Item>
              <Descriptions.Item label="任务数量">
                {getTasksOverview(viewingProject.id).total} 个
              </Descriptions.Item>
              <Descriptions.Item label="项目进度" span={2}>
                {/* 与项目详情保持一致 */}
                <Progress
                  percent={100}
                  size="default"
                  status={calculateTasksProgress(viewingProject.id) === 100 ? 'success' : 'active'}
                  strokeColor={getProgressStrokeColor(calculateTasksProgress(viewingProject.id))}
                />
                <div style={{ fontSize: '12px', color: '#8c8c8c', marginTop: 4, display: 'flex', justifyContent: 'space-between' }}>
                  <span>任务: {calculateTasksProgress(viewingProject.id)}%</span>
                  {calculateTasksProgress(viewingProject.id) < 100 && (
                    <span>未分配: {100 - calculateTasksProgress(viewingProject.id)}%</span>
                  )}
                </div>
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {dayjs(viewingProject.created_at).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="更新时间">
                {dayjs(viewingProject.updated_at).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
            </Descriptions>

            <div style={{ marginTop: 16 }}>
              <Row gutter={16}>
                {/* 任务概览 */}
                <Col span={12}>
                  <Card size="small" title="任务概览（AI智能分析）">
                    {taskOverviewAnalysisLoading ? (
                      <div style={{ textAlign: 'center', padding: '20px' }}>
                        <div style={{ marginBottom: 8 }}>🤖 AI正在分析任务概览...</div>
                        <div style={{ fontSize: '12px', color: '#8c8c8c' }}>正在调用AI接口分析任务执行情况</div>
                      </div>
                    ) : (
                      <Typography.Paragraph style={{ marginBottom: 8 }}>
                        {taskOverviewAnalysisState}
                      </Typography.Paragraph>
                    )}
                  </Card>
                </Col>

                {/* 项目分析内容 */}
                <Col span={12}>
                  <Card size="small" title="项目分析（AI智能分析）">
                    {projectAnalysisLoading ? (
                      <div style={{ textAlign: 'center', padding: '20px' }}>
                        <div style={{ marginBottom: 8 }}>🤖 AI正在分析项目...</div>
                        <div style={{ fontSize: '12px', color: '#8c8c8c' }}>正在调用AI接口进行深度分析</div>
                      </div>
                    ) : (
                      <Typography.Paragraph style={{ marginBottom: 8 }}>
                        {projectAnalysisState}
                      </Typography.Paragraph>
                    )}
                  </Card>
                </Col>
              </Row>

              <Row gutter={16} style={{ marginTop: 16 }}>
                {/* 团队合作情况 */}
                <Col span={12}>
                  <Card size="small" title="团队合作情况（AI智能分析）">
                    {teamCollaborationLoading ? (
                      <div style={{ textAlign: 'center', padding: '20px' }}>
                        <div style={{ marginBottom: 8 }}>🤖 AI正在分析团队合作...</div>
                        <div style={{ fontSize: '12px', color: '#8c8c8c' }}>正在调用AI接口分析团队协作情况</div>
                      </div>
                    ) : (
                      <Typography.Paragraph style={{ marginBottom: 8 }}>
                        {teamCollaborationState}
                      </Typography.Paragraph>
                    )}
                  </Card>
                </Col>

                {/* 核心功能及特点 */}
                <Col span={12}>
                  <Card size="small" title="核心功能与特点">
                    {Array.isArray(viewingProject.tags) && viewingProject.tags.length > 0 ? (
                      <Space wrap>
                        {viewingProject.tags.map((tag, idx) => (
                          <Tag key={idx} color="processing">{tag}</Tag>
                        ))}
                      </Space>
                    ) : (
                      <Text type="secondary">项目创建者或管理者可在项目管理中添加核心功能描述</Text>
                    )}
                  </Card>
                </Col>
              </Row>
            </div>
          </>
        )}
      </Modal>

      {/* 投资项目弹窗 */}
      <Modal
        title="投资项目"
        open={isInvestModalVisible}
        onCancel={() => setIsInvestModalVisible(false)}
        onOk={handleSubmitInvest}
        confirmLoading={investSubmitting}
        okText="确认投资"
        cancelText="取消"
      >
        <div style={{ marginBottom: 16 }}>
          <Text strong>项目：</Text>
          <Text>{investProject?.name}</Text>
        </div>
        <div style={{
          background: '#f6ffed',
          border: '1px solid #b7eb8f',
          padding: 12,
          borderRadius: 6,
          marginBottom: 12,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Text type="success">账户可用额度</Text>
          <Space>
            <Text strong style={{ color: '#52c41a' }}>{typeof user?.balance === 'number' ? user.balance.toFixed(2) : '0.00'}</Text>
            <Text type="secondary">元</Text>
          </Space>
        </div>
        <div style={{ marginBottom: 12 }}>
          <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>选择投资金额（0-1元）</Text>
          <Slider
            min={0}
            max={1}
            step={0.01}
            value={investAmount}
            onChange={setInvestAmount}
            marks={{ 0: '0', 1: '1.00' }}
            tooltip={{ formatter: (v) => `${(v || 0).toFixed(2)} 元` }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <InputNumber
              min={0}
              max={1}
              step={0.01}
              precision={2}
              value={investAmount}
              onChange={(v) => setInvestAmount(Number(v || 0))}
            />
            <Text type="secondary">元</Text>
          </div>
        </div>
        <div style={{
          background: '#fffbe6',
          border: '1px solid #ffe58f',
          padding: 12,
          borderRadius: 6,
          marginBottom: 12
        }}>
          <Text type="secondary">
            此为体验性投资功能，金额范围为0-1元，请理性参与。投资成功后，您将成为该项目股东，按持有比例享有项目分红权。
          </Text>
        </div>
        <Checkbox checked={agreeRisk} onChange={(e) => setAgreeRisk(e.target.checked)}>
          我已知晓风险并同意相关协议
        </Checkbox>
      </Modal>
    </Layout>
  );
};

export default ProjectHall;
