import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import {
  Row,
  Col,
  Card,
  Button,
  Table,
  Modal,
  Form,
  Input,
  Space,
  Tag,
  Avatar,
  Typography,
  message,
  Popconfirm,
  Tooltip,
  Tabs,
  Select,
  DatePicker,
  Progress,
  Badge,
  Statistic,
  Dropdown,
  Menu,
  Switch,
  Upload,
  Slider,
  App,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  UserAddOutlined,
  TeamOutlined,
  LoginOutlined,
  LogoutOutlined,
  StarOutlined,
  StarFilled,
  CalendarOutlined,
  FileTextOutlined,
  BarChartOutlined,
  SettingOutlined,
  MoreOutlined,
  EyeOutlined,
  ProjectOutlined,
  AppstoreOutlined,
  CrownOutlined,
  InfoCircleOutlined,
  BarsOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import useAuthStore from '../../stores/authStore';
import useProjectStore from '../../stores/projectStore';
import useTaskStore from '../../stores/taskStore';
import ProjectLogs from './ProjectLogs';
import ProjectRevenue from './ProjectRevenue';
import ProjectAnalytics from './ProjectAnalytics';
import Tasks from '../Tasks/Tasks';
import ProjectCardGrid from './ProjectCardGrid';
import Voting from '../Voting/Voting';
import api from '../../services/api';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { TabPane } = Tabs;
const { Option } = Select;

const Projects = ({ onProjectSelect, projects: propProjects, viewMode = 'card', searchText = '', sortBy = 'create_time', sortOrder = 'desc', activeTab = 'all' }) => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [viewingProject, setViewingProject] = useState(null);
  const [isPublicProject, setIsPublicProject] = useState(false); // 公开项目开关状态
  const { modal } = App.useApp();
  // 使用传入的activeTab，如果没有传入则使用默认值
  const internalActiveTab = activeTab || 'all';
  // 使用传入的排序参数，如果没有传入则使用默认值
  const [internalSortBy, setInternalSortBy] = useState(sortBy);
  const [internalSortOrder, setInternalSortOrder] = useState(sortOrder);
  const [pinnedProjects, setPinnedProjects] = useState([]);
  const [projectStats, setProjectStats] = useState({ total: 0, active: 0, completed: 0, pending: 0 });
  // 使用传入的viewMode，如果没有传入则使用默认值
  const [internalViewMode, setInternalViewMode] = useState(viewMode);
  const [defaultDetailTab, setDefaultDetailTab] = useState('info'); // 默认详情页标签
  const [isInviteModalVisible, setIsInviteModalVisible] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [isMemberSettingsModalVisible, setIsMemberSettingsModalVisible] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [isMemberInfoModalVisible, setIsMemberInfoModalVisible] = useState(false);
  const fetchTimeoutRef = useRef(null);
  const lastFetchTimeRef = useRef(null);
  
  const { user, updateProfile } = useAuthStore();
  const { tasks, fetchTasks } = useTaskStore();

  // 在组件加载时获取所有任务数据
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // 计算项目的任务总占比 - 从 taskStore 中获取任务数据
  const calculateTasksProgress = (projectId) => {
    console.log('计算项目任务进度 - 项目ID:', projectId);
    console.log('全部任务数据:', tasks);

    // 过滤出属于当前项目的任务
    const projectTasks = tasks.filter(task => task.project === projectId);
    console.log('当前项目的任务:', projectTasks);

    const totalProgress = projectTasks.reduce((total, task) => {
      console.log('任务:', task.title, '占比:', task.progress);
      return total + (task.progress || 0);
    }, 0);

    // 确保总进度不超过100%
    const clampedProgress = Math.min(totalProgress, 100);
    console.log('计算出的总进度:', totalProgress, '限制后的进度:', clampedProgress);
    return clampedProgress;
  };

  // 获取进度条颜色配置
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

  // 处理公开项目开关
  const handlePublicProjectToggle = async (checked) => {
    if (!viewingProject) return;
    
    try {
      setIsPublicProject(checked);
      
      // 调用API更新项目的公开状态 - 使用patch请求只更新is_public字段
      const response = await api.patch(`/projects/${viewingProject.id}/`, {
        is_public: checked
      });
      
      if (response.status === 200) {
        message.success(checked ? '项目已设为公开，将在项目大厅显示' : '项目已设为私有');
        
        // 更新本地项目数据
        setViewingProject({
          ...viewingProject,
          is_public: checked
        });
      } else {
        throw new Error('更新失败');
      }
    } catch (error) {
      console.error('更新项目公开状态失败:', error);
      message.error('更新项目公开状态失败');
      setIsPublicProject(!checked); // 回滚状态
    }
  };
  
  const {
    projects: storeProjects,
    currentProject,
    fetchProjects,
    fetchProject,
    createProject,
    updateProject,
    deleteProject,
    joinProject,
    leaveProject,
    isLoading
  } = useProjectStore();
  
  // 使用传入的项目数据，如果没有传入则使用store中的数据
  const projects = propProjects || storeProjects;

  // 同步传入的viewMode到内部状态
  useEffect(() => {
    setInternalViewMode(viewMode);
  }, [viewMode]);

  // 防抖的获取项目数据函数
  const debouncedFetchProjects = useCallback(() => {
    const now = Date.now();
    // 防止1秒内多次调用
    if (now - lastFetchTimeRef.current < 1000) {
      return;
    }
    
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }
    
    fetchTimeoutRef.current = setTimeout(() => {
      lastFetchTimeRef.current = Date.now();
      fetchProjects();
    }, 200);
  }, [fetchProjects]);

  // 监听 currentProject 变化，同步更新 viewingProject
  useEffect(() => {
    if (currentProject && viewingProject && currentProject.id === viewingProject.id) {
      setViewingProject(currentProject);
    }
  }, [currentProject, viewingProject]);

  useEffect(() => {
    // 组件加载时获取项目数据，避免无限循环
    if (user) {
      debouncedFetchProjects();
    } else {
    }
    
    // 清理函数
    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, []); // 只在组件首次加载时执行

  // 单独的useEffect处理用户信息更新
  useEffect(() => {
    if (user) {
      // 可以在这里处理用户相关的逻辑，但不要调用会更新user的函数
      loadPinnedProjects();
    }
  }, [user?.id]); // 只有用户ID变化时才重新执行

  useEffect(() => {
    calculateProjectStats();
  }, [projects]);

  // 计算项目统计数据
  const calculateProjectStats = () => {
    if (!projects || !Array.isArray(projects)) return;
    
    const stats = projects.reduce((acc, project) => {
      acc.total += 1;
      if (project.status === 'active') acc.active += 1;
      else if (project.status === 'completed') acc.completed += 1;
      else if (project.status === 'pending') acc.pending += 1;
      
      // 计算估值 - 假设从项目数据中获取
      if (project.valuation) {
        acc.totalValuation += Number(project.valuation) || 0;
      }
      
      // 计算融资轮次 - 假设从项目数据中获取
      if (project.funding_rounds) {
        acc.fundingRounds += project.funding_rounds;
      }
      
      return acc;
    }, { 
      total: 0, 
      active: 0, 
      completed: 0, 
      pending: 0, 
      totalValuation: 0, 
      fundingRounds: 0 
    });
    
    setProjectStats(stats);
  };

  // 加载置顶项目
  const loadPinnedProjects = () => {
    const pinned = localStorage.getItem('pinnedProjects');
    if (pinned) {
      setPinnedProjects(JSON.parse(pinned));
    }
  };

  // 切换置顶状态
  const togglePinProject = (projectId) => {
    const newPinned = pinnedProjects.includes(projectId)
      ? pinnedProjects.filter(id => id !== projectId)
      : [...pinnedProjects, projectId];
    
    setPinnedProjects(newPinned);
    localStorage.setItem('pinnedProjects', JSON.stringify(newPinned));
    message.success(pinnedProjects.includes(projectId) ? '取消置顶' : '置顶成功');
  };


  // 获取过滤后的项目
  const getFilteredProjects = () => {
    if (!projects || !Array.isArray(projects)) {
      return [];
    }
    
    
    let filtered = [...projects];
    
    // 按标签页过滤
    if (internalActiveTab === 'created') {
      filtered = filtered.filter(project => isProjectOwner(project));
    } else if (internalActiveTab === 'joined') {
      filtered = filtered.filter(project => isProjectMember(project) && !isProjectOwner(project));
    }
    
    // 搜索过滤
    if (searchText) {
      filtered = filtered.filter(project => 
        project.name.toLowerCase().includes(searchText.toLowerCase()) ||
        (project.description && project.description.toLowerCase().includes(searchText.toLowerCase()))
      );
    }
    
    // 排序
    filtered.sort((a, b) => {
      // 置顶项目优先
      const aIsPinned = pinnedProjects.includes(a.id);
      const bIsPinned = pinnedProjects.includes(b.id);
      
      if (aIsPinned && !bIsPinned) return -1;
      if (!aIsPinned && bIsPinned) return 1;
      
      // 按选定字段排序
      const aValue = a[internalSortBy];
      const bValue = b[internalSortBy];
      
      if (internalSortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    return filtered;
  };

  // 删除项目
  const handleDeleteProject = async (projectId) => {
    console.log('handleDeleteProject被调用，项目ID:', projectId);
    console.log('deleteProject函数:', deleteProject);
    try {
      const result = await deleteProject(projectId);
      console.log('deleteProject返回结果:', result);
      if (result.success) {
        message.success(result.message || '项目删除成功！');
        calculateProjectStats();
      } else {
        message.error(result.error || '删除项目失败');
      }
    } catch (error) {
      console.error('删除项目错误:', error);
      message.error('删除项目时发生错误');
    }
  };

  const handleCreateProject = () => {
    setEditingProject(null);
    setIsModalVisible(true);
    form.resetFields();
  };

  const handleEditProject = (project) => {
    setEditingProject(project);
    setIsModalVisible(true);
    
    // 正确处理日期格式
    const formValues = {
      name: project.name,
      description: project.description,
      project_type: project.project_type,
      status: project.status,
      progress: project.progress || 0,
      is_public: project.is_public || false,
      create_time: project.create_time ? dayjs(project.create_time) : dayjs(),
      tags: project.tags || []
    };
    
    form.setFieldsValue(formValues);
  };

  // 处理成员设置
  const handleMemberSettings = (member) => {
    setSelectedMember(member);
    setIsMemberSettingsModalVisible(true);
  };

  // 处理查看成员信息
  const handleViewMemberInfo = (member) => {
    setSelectedMember(member);
    setIsMemberInfoModalVisible(true);
  };

  // 处理设置管理员
  const handleSetAdmin = async (member) => {
    modal.confirm({
      title: '确认设置管理员权限',
      content: `确定要将 ${member.user_name} 设置为管理员吗？管理员将拥有项目的管理权限。`,
      okText: '确认设置',
      cancelText: '取消',
      onOk: async () => {
        try {
          // 调用API设置管理员
          const response = await api.post(`/projects/${viewingProject.id}/members/${member.user}/set-admin/`);

          if (response.status === 200) {
            // 重新获取项目详情以确保数据同步
            await fetchProject(viewingProject.id);
            message.success(`已将 ${member.user_name} 设置为管理员`);
          }
        } catch (error) {
          console.error('设置管理员失败:', error);
          message.error(error.response?.data?.error || '设置管理员失败');
        }
      }
    });
  };

  // 处理解除管理员
  const handleRemoveAdmin = async (member) => {
    modal.confirm({
      title: '确认解除管理员权限',
      content: `确定要解除 ${member.user_name} 的管理员权限吗？解除后该成员将变为普通成员。`,
      okText: '确认解除',
      cancelText: '取消',
      okType: 'danger',
      onOk: async () => {
        try {
          // 调用API解除管理员
          const response = await api.post(`/projects/${viewingProject.id}/members/${member.user}/remove-admin/`);

          if (response.status === 200) {
            // 重新获取项目详情以确保数据同步
            await fetchProject(viewingProject.id);
            message.success(`已解除 ${member.user_name} 的管理员权限`);
          }
        } catch (error) {
          console.error('解除管理员失败:', error);
          message.error(error.response?.data?.error || '解除管理员失败');
        }
      }
    });
  };

  // 处理删除成员
  const handleDeleteMember = async (member) => {
    modal.confirm({
      title: '确认删除成员',
      content: `确定要删除成员 ${member.user_name} 吗？删除后该成员将无法访问此项目。`,
      okText: '确认删除',
      cancelText: '取消',
      okType: 'danger',
      onOk: async () => {
        try {
          // 调用API删除成员
          const response = await api.delete(`/projects/${viewingProject.id}/members/${member.user}/remove/`);

          if (response.status === 200) {
            // 重新获取项目详情以确保数据同步
            await fetchProject(viewingProject.id);
            message.success(`已删除成员 ${member.user_name}`);
            setIsMemberSettingsModalVisible(false);
          }
        } catch (error) {
          console.error('删除成员失败:', error);
          message.error(error.response?.data?.error || '删除成员失败');
        }
      }
    });
  };

  // 获取进度条颜色的函数
  const getProgressColor = (progress) => {
    if (progress === 0) {
      return '#faad14'; // 黄色
    } else if (progress === 100) {
      return '#1890ff'; // 蓝色
    } else {
      return '#52c41a'; // 绿色 (进行中)
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      console.log('DEBUG: Form values before submit:', values);
      
      if (editingProject) {
        const result = await updateProject(editingProject.id, values);
        if (result.success) {
          message.success('项目更新成功！');
          setIsModalVisible(false);
          form.resetFields();
          calculateProjectStats();
        } else {
          if (typeof result.error === 'object') {
            Object.values(result.error).flat().forEach(error => {
              message.error(error);
            });
          } else {
            message.error(result.error);
          }
        }
      } else {
        const result = await createProject(values);
        if (result.success) {
          message.success('项目创建成功！');
          setIsModalVisible(false);
          form.resetFields();
          calculateProjectStats(); // 重新计算统计数据
        } else {
          if (typeof result.error === 'object') {
            Object.values(result.error).flat().forEach(error => {
              message.error(error);
            });
          } else {
            message.error(result.error);
          }
        }
      }
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    setEditingProject(null);
    form.resetFields();
  };

  const handleJoinProject = async (projectId) => {
    const result = await joinProject(projectId);
    if (result.success) {
      message.success(result.message || '成功加入项目！');
    } else {
      message.error(result.error || '加入项目失败');
    }
  };

  const handleLeaveProject = async (projectId) => {
    const result = await leaveProject(projectId);
    if (result.success) {
      message.success(result.message || '成功退出项目！');
    } else {
      message.error(result.error || '退出项目失败');
    }
  };

  const isProjectMember = (project) => {
    if (!user || !project.members_detail) return false;
    return project.members_detail.some(member => member.user === user.id);
  };

  const isProjectOwner = (project) => {
    console.log('isProjectOwner检查:', {
      user: user,
      userId: user?.id,
      projectOwner: project.owner,
      projectName: project.name,
      isOwner: user && project.owner && project.owner === user.id
    });
    if (!user || !project.owner) return false;
    return project.owner === user.id;
  };

  // 检查用户是否有管理员权限（项目创建者或管理员）
  const hasAdminPermission = (project) => {
    if (!user || !project) return false;
    
    // 如果是项目创建者
    if (project.owner === user.id) return true;
    
    // 如果是管理员
    if (project.members_detail) {
      const userMembership = project.members_detail.find(member => member.user === user.id);
      return userMembership && userMembership.role === 'admin';
    }
    
    return false;
  };

  // 检查用户是否为管理员或项目创建者
  const canViewProjectLogs = (project) => {
    if (!user) return false;
    
    // 系统管理员可以查看所有项目日志
    if (user.is_superuser || user.is_staff) return true;
    
    // 项目创建者可以查看项目日志
    if (isProjectOwner(project)) return true;
    
    // 项目管理员可以查看项目日志
    if (project.members_detail) {
      const userMembership = project.members_detail.find(member => member.user === user.id);
      if (userMembership && userMembership.role === 'admin') return true;
    }
    
    return false;
  };

  const handleViewProject = (project) => {
    setViewingProject(project);
    setIsPublicProject(project.is_public || false); // 初始化公开项目状态
    setDefaultDetailTab('info');
    setIsDetailModalVisible(true);
  };

  // 卡片视图的处理函数
  const handleManageTasks = (project) => {
    if (onProjectSelect) {
      onProjectSelect(project);
    }
    setViewingProject(project);
    setDefaultDetailTab('tasks');
    setIsDetailModalVisible(true);
  };

  const handleManageEvaluation = (project) => {
    setViewingProject(project);
    setDefaultDetailTab('evaluation');
    setIsDetailModalVisible(true);
  };

  const handleManageRecruitment = (project) => {
    setViewingProject(project);
    setDefaultDetailTab('recruitment');
    setIsDetailModalVisible(true);
  };

  const handleManageRevenue = (project) => {
    setViewingProject(project);
    setDefaultDetailTab('analytics');
    setIsDetailModalVisible(true);
  };

  // 新增的处理函数
  const handleManageTeam = (project) => {
    setViewingProject(project);
    setDefaultDetailTab('team');
    setIsDetailModalVisible(true);
  };

  const handleManageAnalytics = (project) => {
    setViewingProject(project);
    setDefaultDetailTab('analytics');
    setIsDetailModalVisible(true);
  };

  const handleManageVoting = (project) => {
    setViewingProject(project);
    setDefaultDetailTab('voting');
    setIsDetailModalVisible(true);
  };

  // 邀请成员处理函数
  const handleInviteMember = async () => {
    if (!viewingProject) {
      message.error('项目信息不存在');
      return;
    }

      // 生成邀请码
      const response = await api.post(`/projects/${viewingProject.id}/generate-invite-code/`);

      const data = await response.data;

      if (response.status == 200) {
        setInviteCode(data.invite_code);
        setIsInviteModalVisible(true);
        message.success('邀请码生成成功');
      } else {
        // 如果API调用失败，使用模拟数据
        console.warn('API调用失败，使用模拟邀请码');
        const mockInviteCode = `INV${viewingProject.id}${Date.now().toString().slice(-6)}`;
        setInviteCode(mockInviteCode);
        setIsInviteModalVisible(true);
        message.success('邀请码生成成功（演示模式）');
      }
  };

  // 关闭邀请弹窗
  const handleInviteModalCancel = () => {
    setIsInviteModalVisible(false);
    setInviteCode('');
  };

  // 复制邀请码
  const handleCopyInviteCode = () => {
    navigator.clipboard.writeText(inviteCode).then(() => {
      message.success('邀请码已复制到剪贴板');
    }).catch(() => {
      message.error('复制失败，请手动复制');
    });
  };

  const columns = [
    {
      title: '项目名称',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => {
        // 获取项目主题色
        const getProjectThemeColor = () => {
          if (isProjectOwner(record)) {
            return '#1890ff'; // 蓝色 - 自己创建的项目
          } else if (isProjectMember(record)) {
            return '#52c41a'; // 绿色 - 被邀请参与的项目
          } else {
            return '#8c8c8c'; // 灰色 - 其他项目
          }
        };

        return (
          <div style={{ 
            display: 'flex', 
            alignItems: 'flex-start', 
            gap: '16px',
            padding: '12px 0',
            borderRadius: '8px',
            transition: 'all 0.2s ease',
            cursor: 'pointer'
          }}>
            {/* 项目图标 */}
            <div style={{ 
              flexShrink: 0, 
              marginTop: '4px',
              position: 'relative'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: `linear-gradient(135deg, ${getProjectThemeColor()}15 0%, ${getProjectThemeColor()}25 100%)`,
                border: `2px solid ${getProjectThemeColor()}30`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 2px 8px ${getProjectThemeColor()}20`,
                transition: 'all 0.3s ease'
              }}>
                <ProjectOutlined 
                  style={{ 
                    fontSize: 24, 
                    color: getProjectThemeColor(),
                    filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))'
                  }} 
                />
              </div>
              {pinnedProjects.includes(record.id) && (
                <div style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #faad14 0%, #ffc53d 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 4px rgba(250, 173, 20, 0.3)',
                  border: '2px solid #ffffff'
                }}>
                  <StarFilled style={{ color: '#ffffff', fontSize: '10px' }} />
                </div>
              )}
            </div>
            
            {/* 项目信息 */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ 
                background: 'linear-gradient(135deg, #ffffff 0%, #fafbfc 100%)',
                borderRadius: '8px',
                padding: '12px 16px',
                border: '1px solid #f0f0f0',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                transition: 'all 0.2s ease'
              }}>
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  {/* 标题行 */}
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px',
                    marginBottom: '4px'
                  }}>
                    <Text strong style={{ 
                      color: getProjectThemeColor(), 
                      fontSize: '16px',
                      fontWeight: 600,
                      textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                    }}>
                      {text}
                    </Text>
                  </div>
                  
                  {/* 描述 */}
                  <Text 
                    type="secondary" 
                    ellipsis 
                    style={{ 
                      fontSize: '14px', 
                      lineHeight: '1.5',
                      color: '#666666',
                      marginBottom: '8px'
                    }}
                  >
                    {record.description}
                  </Text>
                  
                  {/* 标签 */}
                  {record.tags && record.tags.length > 0 && (
                    <div style={{ 
                      display: 'flex', 
                      flexWrap: 'wrap', 
                      gap: '6px',
                      marginTop: '4px'
                    }}>
                      {record.tags.map(tag => (
                        <Tag 
                          key={tag} 
                          size="small" 
                          style={{ 
                            background: `linear-gradient(135deg, ${getProjectThemeColor()}15 0%, ${getProjectThemeColor()}25 100%)`,
                            border: `1px solid ${getProjectThemeColor()}30`,
                            color: getProjectThemeColor(),
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 500,
                            padding: '2px 8px',
                            margin: 0,
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                          }}
                        >
                          {tag}
                        </Tag>
                      ))}
                    </div>
                  )}
                </Space>
              </div>
            </div>
          </div>
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const statusConfig = {
          active: { 
            color: '#52c41a', 
            text: '进行中',
            bgColor: '#f6ffed',
            borderColor: '#b7eb8f'
          },
          completed: { 
            color: '#1890ff', 
            text: '已完成',
            bgColor: '#e6f7ff',
            borderColor: '#91d5ff'
          },
          pending: { 
            color: '#faad14', 
            text: '待审核',
            bgColor: '#fffbe6',
            borderColor: '#ffe58f'
          },
        };
        const config = statusConfig[status] || { 
          color: '#8c8c8c', 
          text: '未知',
          bgColor: '#f5f5f5',
          borderColor: '#d9d9d9'
        };
        
        return (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '6px 12px',
            borderRadius: '20px',
            background: config.bgColor,
            border: `1px solid ${config.borderColor}`,
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            transition: 'all 0.2s ease'
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: config.color,
              marginRight: '6px',
              boxShadow: `0 0 4px ${config.color}40`
            }} />
            <span style={{
              color: config.color,
              fontSize: '13px',
              fontWeight: 500,
              textShadow: '0 1px 2px rgba(0,0,0,0.1)'
            }}>
              {config.text}
            </span>
          </div>
        );
      },
    },
    {
      title: '负责人',
      dataIndex: 'owner_name',
      key: 'owner_name',
      render: (text, record) => {
        // 获取项目主题色
        const getProjectThemeColor = () => {
          if (isProjectOwner(record)) {
            return '#1890ff'; // 蓝色 - 自己创建的项目
          } else if (isProjectMember(record)) {
            return '#52c41a'; // 绿色 - 被邀请参与的项目
          } else {
            return '#8c8c8c'; // 灰色 - 其他项目
          }
        };

        return (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '8px 12px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #ffffff 0%, #fafbfc 100%)',
            border: '1px solid #f0f0f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            transition: 'all 0.2s ease'
          }}>
            <div style={{
              position: 'relative',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${getProjectThemeColor()} 0%, ${getProjectThemeColor()}dd 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 2px 6px ${getProjectThemeColor()}30`,
              border: '2px solid #ffffff'
            }}>
              <UserOutlined style={{ 
                color: '#ffffff', 
                fontSize: '16px',
                filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))'
              }} />
            </div>
            <span style={{
              color: '#333333',
              fontSize: '14px',
              fontWeight: 500,
              textShadow: '0 1px 2px rgba(0,0,0,0.1)'
            }}>
              {text}
            </span>
          </div>
        );
      },
    },
    {
      title: '成员',
      dataIndex: 'member_count',
      key: 'member_count',
      render: (count, record) => (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          padding: '8px 12px',
          borderRadius: '8px',
          background: 'linear-gradient(135deg, #ffffff 0%, #fafbfc 100%)',
          border: '1px solid #f0f0f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          transition: 'all 0.2s ease'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '6px',
              background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 4px rgba(82, 196, 26, 0.3)'
            }}>
              <TeamOutlined style={{ 
                color: '#ffffff', 
                fontSize: '12px',
                filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))'
              }} />
            </div>
            <span style={{
              color: '#333333',
              fontSize: '14px',
              fontWeight: 500,
              textShadow: '0 1px 2px rgba(0,0,0,0.1)'
            }}>
              {count} 人
            </span>
          </div>
          {record.members_detail && record.members_detail.length > 0 && (
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '4px'
            }}>
              {record.members_detail.slice(0, 3).map(member => (
                <div key={member.user} style={{
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%)',
                  border: '1px solid #91d5ff',
                  fontSize: '11px',
                  color: '#1890ff',
                  fontWeight: 500,
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                }}>
                  {member.user_name}
                </div>
              ))}
              {record.members_detail.length > 3 && (
                <div style={{
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%)',
                  border: '1px solid #d9d9d9',
                  fontSize: '11px',
                  color: '#8c8c8c',
                  fontWeight: 500,
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                }}>
                  +{record.members_detail.length - 3}
                </div>
              )}
            </div>
          )}
        </div>
      ),
    },
    {
      title: '进度',
      dataIndex: 'progress',
      key: 'progress',
      render: (progress = 0, record) => {
        const tasksProgress = calculateTasksProgress(record.id);
        const strokeColor = getProgressStrokeColor(tasksProgress);
        const unallocatedProgress = Math.max(0, 100 - tasksProgress);

        return (
          <Space direction="vertical" size="small">
            <Progress
              percent={100}
              size="small"
              strokeColor={strokeColor}
              status={tasksProgress === 100 ? 'success' : 'active'}
            />
            <div style={{ fontSize: '10px', color: '#8c8c8c' }}>
              <div>任务: {tasksProgress}% | 未分配: {unallocatedProgress}%</div>
            </div>
            {record.task_count && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                {record.completed_tasks || 0}/{record.task_count} 任务
              </Text>
            )}
          </Space>
        );
      },
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record) => {
        const isMember = isProjectMember(record);
        const isOwner = isProjectOwner(record);
        const isPinned = pinnedProjects.includes(record.id);

        const menuItems = [
          {
            key: 'view',
            icon: <EyeOutlined />,
            label: '查看详情',
          },
          {
            key: 'pin',
            icon: isPinned ? <StarFilled /> : <StarOutlined />,
            label: isPinned ? '取消置顶' : '置顶项目',
          },
        ];

        if (isOwner) {
          menuItems.push(
            {
              key: 'edit',
              icon: <EditOutlined />,
              label: '编辑项目',
            },
            {
              key: 'manage',
              icon: <SettingOutlined />,
              label: '项目设置',
            },
            {
              type: 'divider',
            },
            {
              key: 'delete',
              icon: <DeleteOutlined />,
              label: '删除项目',
              danger: true,
            }
          );
        }

        const handleMenuClick = ({ key }) => {
          switch (key) {
            case 'view':
              handleViewProject(record);
              break;
            case 'pin':
              togglePinProject(record.id);
              break;
            case 'edit':
              handleEditProject(record);
              break;
            case 'manage':
              message.info('项目设置功能待实现');
              break;
            case 'delete':
              console.log('表格删除按钮被点击，项目ID:', record.id);
              console.log('handleDeleteProject函数:', handleDeleteProject);
              modal.confirm({
                title: '确定要删除这个项目吗？',
                content: `项目"${record.name}"将被永久删除，此操作不可撤销。`,
                okText: '确定删除',
                okType: 'danger',
                cancelText: '取消',
                onOk: async () => {
                  console.log('确认删除，调用handleDeleteProject');
                  try {
                    await handleDeleteProject(record.id);
                  } catch (error) {
                    console.error('删除项目时出错:', error);
                  }
                },
              });
              break;
          }
        };

        return (
          <Space>
            {!isMember && !isOwner && (
              <Popconfirm
                title="确定要加入这个项目吗？"
                onConfirm={() => handleJoinProject(record.id)}
                okText="确定"
                cancelText="取消"
              >
                <Button
                  type="link"
                  icon={<LoginOutlined />}
                >
                  加入
                </Button>
              </Popconfirm>
            )}
            
            {isMember && !isOwner && (
              <Popconfirm
                title="确定要退出这个项目吗？"
                onConfirm={() => handleLeaveProject(record.id)}
                okText="确定"
                cancelText="取消"
              >
                <Button
                  type="link"
                  danger
                  icon={<LogoutOutlined />}
                >
                  退出
                </Button>
              </Popconfirm>
            )}

            <Dropdown
              menu={{ items: menuItems, onClick: handleMenuClick }}
              trigger={['click']}
            >
              <Button type="link" icon={<MoreOutlined />} />
            </Dropdown>
          </Space>
        );
      },
    },
  ];

  return (
    <div>
      {/* 项目列表内容 */}
      {internalViewMode === 'card' ? (
          <ProjectCardGrid
            projects={getFilteredProjects()}
            loading={isLoading}
            pinnedProjects={pinnedProjects}
            isProjectOwner={isProjectOwner}
            isProjectMember={isProjectMember}
            onPin={togglePinProject}
            onView={handleViewProject}
            onEdit={handleEditProject}
            onDelete={handleDeleteProject}
            onJoin={handleJoinProject}
            onLeave={handleLeaveProject}
            onManageTasks={handleManageTasks}
            onManageEvaluation={handleManageEvaluation}
            onManageRecruitment={handleManageRecruitment}
            onManageRevenue={handleManageRevenue}
            onManageTeam={handleManageTeam}
            onManageAnalytics={handleManageAnalytics}
            onManageVoting={handleManageVoting}
          />
        ) : (
          <Table
            columns={columns}
            dataSource={getFilteredProjects()}
            rowKey="id"
            loading={isLoading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 个项目`,
            }}
          />
        )}

      <Modal
        title={editingProject ? '编辑项目' : '创建项目'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        confirmLoading={isLoading}
        width={720}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="项目名称"
                rules={[
                  { required: true, message: '请输入项目名称！' },
                  { max: 200, message: '项目名称不能超过200个字符！' },
                ]}
              >
                <Input placeholder="请输入项目名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="project_type"
                label="项目类型"
                rules={[{ required: true, message: '请选择项目类型！' }]}
              >
                <Select placeholder="请选择项目类型">
                  <Option value="research">研发项目</Option>
                  <Option value="academic">学术项目</Option>
                  <Option value="design">设计项目</Option>
                  <Option value="innovation">创新实验</Option>
                  <Option value="development">开发项目</Option>
                  <Option value="other">其他</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="status"
                label="项目状态"
                initialValue="active"
              >
                <Select>
                  <Option value="active">进行中</Option>
                  <Option value="pending">待审核</Option>
                  <Option value="completed">已完成</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="progress"
                label="项目进度"
                initialValue={0}
              >
                <Slider
                  min={0}
                  max={100}
                  marks={{
                    0: '0%',
                    25: '25%',
                    50: '50%',
                    75: '75%',
                    100: '100%'
                  }}
                  tooltip={{
                    formatter: (value) => `${value}%`
                  }}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="create_time"
                label="创建时间"
                initialValue={dayjs()}
              >
                <DatePicker 
                  style={{ width: '100%' }} 
                  showTime
                  format="YYYY-MM-DD HH:mm:ss"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="is_public"
                label="公开展示"
                valuePropName="checked"
                tooltip="开启开关后，项目将显示在项目大厅内"
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="项目描述"
            rules={[
              { required: true, message: '请输入项目描述！' },
            ]}
          >
            <TextArea
              rows={4}
              placeholder="请详细描述您的项目..."
              showCount
              maxLength={1000}
            />
          </Form.Item>

          <Form.Item
            name="tags"
            label="项目标签"
          >
            <Select
              mode="tags"
              placeholder="输入标签，按回车添加"
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 项目详情Modal */}
      <Modal
        title={`项目详情 - ${viewingProject?.name}`}
        open={isDetailModalVisible}
        onCancel={() => {
          setIsDetailModalVisible(false);
          setViewingProject(null);
          setIsPublicProject(false); // 重置公开项目状态
          setDefaultDetailTab('info');
        }}
        footer={null}
        width={1200}
        style={{ top: 20 }}
      >
        {viewingProject && (
          <Tabs activeKey={defaultDetailTab} onChange={setDefaultDetailTab}>
            <Tabs.TabPane tab="基本信息" key="info">
              <Row gutter={[24, 24]}>
                <Col span={12}>
                  <Card 
                    title={
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <ProjectOutlined style={{ color: '#1890ff' }} />
                          <span style={{ fontSize: '16px', fontWeight: '600' }}>项目概况</span>
                        </div>
                        <Tag 
                          color={
                          viewingProject.status === 'active' ? 'success' : 
                          viewingProject.status === 'completed' ? 'default' : 'warning'
                          }
                          style={{ 
                            fontSize: '12px',
                            borderRadius: '12px',
                            border: 'none',
                            fontWeight: '500'
                          }}
                        >
                          {viewingProject.status === 'active' ? '进行中' : 
                           viewingProject.status === 'completed' ? '已完成' : '待审核'}
                        </Tag>
                      </div>
                    }
                    size="small"
                    style={{
                      borderRadius: '12px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                      border: '1px solid #f0f0f0'
                    }}
                    bodyStyle={{ padding: '20px' }}
                  >
                    <Space direction="vertical" style={{ width: '100%' }} size="large">
                      {/* 项目名称 */}
                      <div style={{ 
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        borderRadius: '8px',
                        padding: '16px',
                        color: 'white',
                        position: 'relative'
                      }}>
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: '12px'
                        }}>
                          <div style={{ 
                            fontSize: '18px', 
                            fontWeight: 'bold',
                            flex: 1,
                            textAlign: 'center'
                          }}>
                            {viewingProject.name}
                          </div>
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '8px',
                            background: 'rgba(255, 255, 255, 0.2)',
                            padding: '6px 12px',
                            borderRadius: '20px',
                            backdropFilter: 'blur(10px)'
                          }}>
                            <span style={{ fontSize: '14px', fontWeight: '500' }}>公开项目</span>
                            <Switch
                              size="small"
                              checked={isPublicProject}
                              onChange={handlePublicProjectToggle}
                              checkedChildren="开"
                              unCheckedChildren="关"
                              style={{
                                backgroundColor: isPublicProject ? '#52c41a' : '#d9d9d9'
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* 项目描述 */}
                      <div style={{ 
                        background: '#f8f9fa',
                        borderRadius: '8px',
                        padding: '12px',
                        border: '1px solid #e9ecef'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                          <FileTextOutlined style={{ color: '#6c757d', marginTop: '2px' }} />
                          <div>
                            <Text strong style={{ color: '#495057' }}>项目描述</Text>
                            <div style={{ marginTop: '4px', color: '#6c757d', lineHeight: '1.5' }}>
                              {viewingProject.description || '暂无描述'}
                      </div>
                          </div>
                        </div>
                      </div>

                      {/* 项目基本信息网格 */}
                      <Row gutter={[12, 12]}>
                        <Col span={12}>
                          <div style={{ 
                            background: '#fff',
                            borderRadius: '8px',
                            padding: '12px',
                            border: '1px solid #e9ecef',
                            textAlign: 'center'
                          }}>
                            <div style={{ color: '#6c757d', fontSize: '12px', marginBottom: '4px' }}>项目类型</div>
                            <div style={{ fontWeight: '600', color: '#495057' }}>
                              {viewingProject.project_type || '其他'}
                            </div>
                          </div>
                        </Col>
                        <Col span={12}>
                          <div style={{ 
                            background: '#fff',
                            borderRadius: '8px',
                            padding: '12px',
                            border: '1px solid #e9ecef',
                            textAlign: 'center'
                          }}>
                            <div style={{ color: '#6c757d', fontSize: '12px', marginBottom: '4px' }}>成员数量</div>
                            <div style={{ fontWeight: '600', color: '#495057' }}>
                              {viewingProject.member_count} 人
                            </div>
                          </div>
                        </Col>
                        <Col span={12}>
                          <div style={{ 
                            background: '#fff',
                            borderRadius: '8px',
                            padding: '12px',
                            border: '1px solid #e9ecef',
                            textAlign: 'center'
                          }}>
                            <div style={{ color: '#6c757d', fontSize: '12px', marginBottom: '4px' }}>项目负责人</div>
                            <div style={{ fontWeight: '600', color: '#495057' }}>
                              {viewingProject.owner_name}
                            </div>
                          </div>
                        </Col>
                        <Col span={12}>
                          <div style={{ 
                            background: '#fff',
                            borderRadius: '8px',
                            padding: '12px',
                            border: '1px solid #e9ecef',
                            textAlign: 'center'
                          }}>
                            <div style={{ color: '#6c757d', fontSize: '12px', marginBottom: '4px' }}>创建时间</div>
                            <div style={{ fontWeight: '600', color: '#495057', fontSize: '12px' }}>
                              {new Date(viewingProject.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </Col>
                      </Row>

                      {/* 项目进度 */}
                      <div style={{
                        background: '#f8f9fa',
                        borderRadius: '8px',
                        padding: '12px',
                        border: '1px solid #e9ecef'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <BarChartOutlined style={{ color: '#6c757d' }} />
                          <Text strong style={{ color: '#495057' }}>项目进度</Text>
                        </div>
                        {(() => {
                          const tasksProgress = calculateTasksProgress(viewingProject.id);
                          const strokeColor = getProgressStrokeColor(tasksProgress);
                          const unallocatedProgress = Math.max(0, 100 - tasksProgress);

                          return (
                            <>
                              <Progress
                                percent={100}
                                size="small"
                                strokeColor={strokeColor}
                                style={{ marginBottom: '8px' }}
                              />
                              <div style={{ fontSize: '12px', color: '#6c757d' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                  <span>项目进度: {tasksProgress}%</span>
                                  <span>未分配: {unallocatedProgress}%</span>
                                </div>
                                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <div style={{
                                      width: '8px',
                                      height: '8px',
                                      backgroundColor: '#52c41a',
                                      borderRadius: '50%'
                                    }}></div>
                                    <span>任务完成 ({tasksProgress}%)</span>
                                  </div>
                                  {unallocatedProgress > 0 && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                      <div style={{
                                        width: '8px',
                                        height: '8px',
                                        backgroundColor: '#faad14',
                                        borderRadius: '50%'
                                      }}></div>
                                      <span>未分配 ({unallocatedProgress}%)</span>
                                    </div>
                                  )}
                                  {tasksProgress === 100 && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                      <div style={{
                                        width: '8px',
                                        height: '8px',
                                        backgroundColor: '#1890ff',
                                        borderRadius: '50%'
                                      }}></div>
                                      <span>项目完成</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </>
                          );
                        })()}
                      </div>


                      {/* 项目标签 */}
                      {viewingProject.tag_list && viewingProject.tag_list.length > 0 && (
                        <div style={{ 
                          background: '#f8f9fa',
                          borderRadius: '8px',
                          padding: '12px',
                          border: '1px solid #e9ecef'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <AppstoreOutlined style={{ color: '#6c757d' }} />
                            <Text strong style={{ color: '#495057' }}>项目标签</Text>
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {viewingProject.tag_list.map(tag => (
                              <Tag 
                                key={tag} 
                                color="blue" 
                                size="small"
                                style={{ 
                                  borderRadius: '12px',
                                  border: 'none',
                                  background: 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)',
                                  color: 'white'
                                }}
                              >
                                {tag}
                              </Tag>
                            ))}
                          </div>
                        </div>
                      )}
                    </Space>
                  </Card>
                </Col>
                <Col span={12}>
                  <Card 
                    title={
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <TeamOutlined style={{ color: '#52c41a' }} />
                          <span style={{ fontSize: '16px', fontWeight: '600' }}>项目成员</span>
                          <Badge 
                            count={viewingProject.member_count || 0} 
                            style={{ backgroundColor: '#52c41a' }}
                          />
                        </div>
                        {hasAdminPermission(viewingProject) && (
                          <Button 
                            type="primary" 
                            size="small" 
                            icon={<UserAddOutlined />}
                            onClick={handleInviteMember}
                            style={{ 
                              backgroundColor: '#52c41a',
                              borderColor: '#52c41a',
                              borderRadius: '6px',
                              fontWeight: '500'
                            }}
                          >
                            邀请成员
                          </Button>
                        )}
                      </div>
                    } 
                    size="small"
                    style={{
                      borderRadius: '12px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                      border: '1px solid #f0f0f0'
                    }}
                    bodyStyle={{ padding: '20px' }}
                  >
                    {viewingProject.members_detail && viewingProject.members_detail.length > 0 ? (
                      <Space direction="vertical" style={{ width: '100%' }} size="middle">
                        {viewingProject.members_detail.map((member, index) => (
                          <div 
                            key={member.user} 
                            style={{ 
                              background: index % 2 === 0 ? '#f8f9fa' : '#fff',
                              borderRadius: '8px',
                              padding: '12px',
                              border: '1px solid #e9ecef',
                              transition: 'all 0.3s ease'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ position: 'relative' }}>
                                  <Avatar 
                                    size={40} 
                                    icon={<UserOutlined />}
                                    style={{ 
                                      backgroundColor: member.role === 'admin' ? '#722ed1' : '#52c41a',
                                      border: '2px solid #fff',
                                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                                    }}
                                  />
                                  {member.role === 'admin' && (
                                    <div style={{
                                      position: 'absolute',
                                      bottom: -2,
                                      right: -2,
                                      background: 'linear-gradient(135deg, #722ed1, #9254de)',
                                      color: 'white',
                                      fontSize: '10px',
                                      fontWeight: 'bold',
                                      padding: '2px 4px',
                                      borderRadius: '4px',
                                      border: '2px solid #fff',
                                      boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                                      minWidth: '20px',
                                      textAlign: 'center',
                                      lineHeight: 1
                                    }}>
                                      管理
                                    </div>
                                  )}
                                  {member.role === 'owner' && (
                                    <div style={{
                                      position: 'absolute',
                                      bottom: -2,
                                      right: -2,
                                      background: 'linear-gradient(135deg, #fa8c16, #ffa940)',
                                      color: 'white',
                                      fontSize: '10px',
                                      fontWeight: 'bold',
                                      padding: '2px 4px',
                                      borderRadius: '4px',
                                      border: '2px solid #fff',
                                      boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                                      minWidth: '20px',
                                      textAlign: 'center',
                                      lineHeight: 1
                                    }}>
                                      创建
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <div style={{ fontWeight: '600', color: '#495057', fontSize: '14px' }}>
                                    {member.user_name}
                                  </div>
                                  <div style={{ color: '#6c757d', fontSize: '12px' }}>
                                    {member.role === 'owner' ? '项目负责人' : 
                                     member.role === 'admin' ? '管理员' : '项目成员'}
                                  </div>
                                </div>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                {/* 成员信息标签 */}
                                <div style={{ display: 'flex', gap: '8px', fontSize: '11px' }}>
                                  <div style={{ 
                                    background: '#e6f7ff',
                                    color: '#1890ff',
                                    padding: '2px 6px',
                                    borderRadius: '8px'
                                  }}>
                                    贡献: {member.contribution_percentage || 0}%
                                  </div>
                                  {Number(member.investment_amount || 0) > 0 && (
                                    <div style={{ 
                                      background: '#fff7e6',
                                      color: '#fa8c16',
                                      padding: '2px 6px',
                                      borderRadius: '8px'
                                    }}>
                                      投资: ¥{Number(member.investment_amount || 0).toFixed(0)}
                                    </div>
                                  )}
                                  <div style={{ 
                                    background: '#f6ffed',
                                    color: '#52c41a',
                                    padding: '2px 6px',
                                    borderRadius: '8px'
                                  }}>
                                    股权: {Number(member.equity_percentage || 0).toFixed(2)}%
                                  </div>
                                </div>
                                
                                {/* 设置按钮 - 只有管理员和项目创建者才能看到 */}
                                {hasAdminPermission(viewingProject) && (
                                <Dropdown
                                  menu={{
                                    items: [
                                      {
                                        key: 'view',
                                        label: '查看信息',
                                        icon: <InfoCircleOutlined />,
                                        onClick: () => handleViewMemberInfo(member)
                                      },
                                      // 根据成员角色显示不同的管理员操作
                                      ...(member.role === 'admin' ? [
                                        {
                                          key: 'remove-admin',
                                          label: '解除管理员',
                                          icon: <CrownOutlined />,
                                          disabled: member.role === 'owner',
                                          onClick: () => handleRemoveAdmin(member)
                                        }
                                      ] : [
                                        {
                                          key: 'set-admin',
                                          label: '设置管理员',
                                          icon: <CrownOutlined />,
                                          disabled: member.role === 'owner',
                                          onClick: () => handleSetAdmin(member)
                                        }
                                      ]),
                                      {
                                        type: 'divider'
                                      },
                                      {
                                        key: 'delete',
                                        label: '删除成员',
                                        icon: <DeleteOutlined />,
                                        danger: true,
                                        disabled: member.role === 'owner' || member.user === user?.id,
                                        onClick: () => handleDeleteMember(member)
                                      }
                                    ]
                                  }}
                                    trigger={['click']}
                                    placement="bottomRight"
                                  >
                                    <Button 
                                      type="text" 
                                      size="small"
                                      icon={<SettingOutlined />}
                                      style={{
                                        color: '#8c8c8c',
                                        border: '1px solid #d9d9d9',
                                        borderRadius: '6px',
                                        height: '28px',
                                        width: '28px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                      }}
                                    />
                                  </Dropdown>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </Space>
                    ) : (
                      <div style={{ 
                        textAlign: 'center', 
                        padding: '40px 20px',
                        color: '#6c757d'
                      }}>
                        <UserOutlined style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }} />
                        <div style={{ fontSize: '16px', marginBottom: '8px' }}>暂无成员信息</div>
                        <div style={{ fontSize: '12px' }}>项目负责人可以邀请团队成员加入</div>
                      </div>
                    )}
                  </Card>

                  {/* 股东成员窗口 */}
                  <Card 
                    title={
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CrownOutlined style={{ color: '#fa8c16' }} />
                        <span style={{ fontSize: '16px', fontWeight: '600' }}>股东成员</span>
                        <Tag color="gold" style={{ marginLeft: '8px' }}>
                          股权持有者
                        </Tag>
                      </div>
                    }
                    size="small" 
                    style={{ 
                      marginTop: 16,
                      borderRadius: '12px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                      border: '1px solid #f0f0f0'
                    }}
                    bodyStyle={{ padding: '20px' }}
                  >
                    {viewingProject.members_detail && viewingProject.members_detail.filter(member => 
                      Number(member.equity_percentage || 0) > 0
                    ).length > 0 ? (
                      <Space direction="vertical" style={{ width: '100%' }} size="middle">
                        {viewingProject.members_detail
                          .filter(member => Number(member.equity_percentage || 0) > 0)
                          .sort((a, b) => Number(b.equity_percentage || 0) - Number(a.equity_percentage || 0))
                          .map((member, index) => (
                          <div 
                            key={member.user} 
                            style={{ 
                              background: index % 2 === 0 ? '#fff7e6' : '#fff',
                              borderRadius: '8px',
                              padding: '16px',
                              border: '1px solid #ffd591',
                              transition: 'all 0.3s ease',
                              position: 'relative'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ position: 'relative' }}>
                                  <Avatar 
                                    size={40} 
                                    icon={<UserOutlined />}
                                    style={{ 
                                      backgroundColor: '#fa8c16',
                                      border: '2px solid #fff',
                                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                                    }}
                                  />
                                  {/* 股权排名标识 */}
                                  {index < 3 && (
                                    <div style={{
                                      position: 'absolute',
                                      top: -4,
                                      left: -4,
                                      width: 20,
                                      height: 20,
                                      borderRadius: '50%',
                                      background: index === 0 ? 'linear-gradient(135deg, #ffd700, #ffed4e)' :
                                                  index === 1 ? 'linear-gradient(135deg, #c0c0c0, #e8e8e8)' :
                                                  'linear-gradient(135deg, #cd7f32, #daa520)',
                                      color: 'white',
                                      fontSize: '10px',
                                      fontWeight: 'bold',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      border: '2px solid #fff',
                                      boxShadow: '0 1px 4px rgba(0,0,0,0.2)'
                                    }}>
                                      {index + 1}
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <div style={{ fontWeight: '600', color: '#495057', fontSize: '14px' }}>
                                    {member.user_name}
                                  </div>
                                  <div style={{ color: '#6c757d', fontSize: '12px' }}>
                                    {member.role === 'owner' ? '项目负责人' : 
                                     member.role === 'admin' ? '管理员' : '股东成员'}
                                  </div>
                                </div>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                {/* 股权信息 */}
                                <div style={{ textAlign: 'right' }}>
                                  <div style={{ 
                                    background: 'linear-gradient(135deg, #fa8c16 0%, #ffa940 100%)',
                                    color: 'white',
                                    padding: '6px 12px',
                                    borderRadius: '16px',
                                    fontSize: '14px',
                                    fontWeight: 'bold',
                                    marginBottom: '4px',
                                    boxShadow: '0 2px 4px rgba(250, 140, 22, 0.3)'
                                  }}>
                                    {Number(member.equity_percentage || 0).toFixed(2)}% 股权
                                  </div>
                                  <div style={{ display: 'flex', gap: '8px', fontSize: '11px' }}>
                                    {Number(member.investment_amount || 0) > 0 && (
                                      <div style={{ 
                                        background: '#e6f7ff',
                                        color: '#1890ff',
                                        padding: '2px 6px',
                                        borderRadius: '8px'
                                      }}>
                                        投资: ¥{Number(member.investment_amount || 0).toFixed(0)}
                                      </div>
                                    )}
                                    <div style={{ 
                                      background: '#f6ffed',
                                      color: '#52c41a',
                                      padding: '2px 6px',
                                      borderRadius: '8px'
                                    }}>
                                      贡献: {member.contribution_percentage || 0}%
                                    </div>
                                  </div>
                                </div>
                                
                                {/* 设置按钮 - 只有管理员和项目创建者才能看到 */}
                                {hasAdminPermission(viewingProject) && (
                                  <Dropdown
                                    menu={{
                                      items: [
                                        {
                                          key: 'view',
                                          label: '查看信息',
                                          icon: <InfoCircleOutlined />,
                                          onClick: () => handleViewMemberInfo(member)
                                        },
                                        // 根据成员角色显示不同的管理员操作
                                        ...(member.role === 'admin' ? [
                                          {
                                            key: 'remove-admin',
                                            label: '解除管理员',
                                            icon: <CrownOutlined />,
                                            disabled: member.role === 'owner',
                                            onClick: () => handleRemoveAdmin(member)
                                          }
                                        ] : [
                                          {
                                            key: 'set-admin',
                                            label: '设置管理员',
                                            icon: <CrownOutlined />,
                                            disabled: member.role === 'owner',
                                            onClick: () => handleSetAdmin(member)
                                          }
                                        ]),
                                        {
                                          type: 'divider'
                                        },
                                        {
                                          key: 'delete',
                                          label: '删除成员',
                                          icon: <DeleteOutlined />,
                                          danger: true,
                                          disabled: member.role === 'owner' || member.user === user?.id,
                                          onClick: () => handleDeleteMember(member)
                                        }
                                      ]
                                    }}
                                    trigger={['click']}
                                    placement="bottomRight"
                                  >
                                    <Button 
                                      type="text" 
                                      size="small"
                                      icon={<SettingOutlined />}
                                      style={{
                                        color: '#8c8c8c',
                                        border: '1px solid #d9d9d9',
                                        borderRadius: '6px',
                                        height: '28px',
                                        width: '28px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                      }}
                                    />
                                  </Dropdown>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </Space>
                    ) : (
                      <div style={{ 
                        textAlign: 'center', 
                        padding: '40px 20px',
                        color: '#6c757d'
                      }}>
                        <CrownOutlined style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }} />
                        <div style={{ fontSize: '16px', marginBottom: '8px' }}>暂无股东成员</div>
                        <div style={{ fontSize: '12px' }}>拥有股权的成员将显示在此处</div>
                      </div>
                    )}
                  </Card>
                </Col>
              </Row>
            </Tabs.TabPane>
            
            <Tabs.TabPane tab="任务管理" key="tasks">
              <Tasks 
                projectId={viewingProject.id} 
                project={viewingProject} 
                isProjectOwner={hasAdminPermission(viewingProject)}
              />
            </Tabs.TabPane>
            
            <Tabs.TabPane tab="数据分析" key="analytics">
              {/* 合并数据分析和收益管理 */}
              <Tabs defaultActiveKey="data" type="card">
                <Tabs.TabPane tab="项目分析" key="data">
                  <ProjectAnalytics
                    projectId={viewingProject.id} 
                    project={viewingProject} 
                    isProjectOwner={hasAdminPermission(viewingProject)} 
                  />
                </Tabs.TabPane>
                <Tabs.TabPane tab="收益管理" key="revenue">
                  <ProjectRevenue projectId={viewingProject.id} isProjectOwner={hasAdminPermission(viewingProject)} />
                </Tabs.TabPane>
              </Tabs>
            </Tabs.TabPane>
            
            <Tabs.TabPane tab="项目投票" key="voting">
              <Voting projectId={viewingProject.id} />
            </Tabs.TabPane>
            
            {/* 项目日志 - 只有管理员和创建者可见 */}
            {canViewProjectLogs(viewingProject) && (
              <Tabs.TabPane tab="项目日志" key="logs">
                <Card 
                  title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FileTextOutlined style={{ color: '#1890ff' }} />
                      <span style={{ fontSize: '16px', fontWeight: '600' }}>项目操作日志</span>
                    </div>
                  }
                  style={{
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                    border: '1px solid #f0f0f0'
                  }}
                  bodyStyle={{ padding: '20px' }}
                >
                  <ProjectLogs 
                    projectId={viewingProject.id} 
                    showTitle={false} 
                    maxHeight={600}
                    showAllLogs={true}
                  />
                </Card>
              </Tabs.TabPane>
            )}
          </Tabs>
        )}
      </Modal>

      {/* 邀请成员弹窗 */}
      <Modal
        title="邀请成员"
        open={isInviteModalVisible}
        onCancel={handleInviteModalCancel}
        footer={[
          <Button key="copy" type="primary" onClick={handleCopyInviteCode}>
            复制邀请码
          </Button>,
          <Button key="close" onClick={handleInviteModalCancel}>
            关闭
          </Button>
        ]}
        width={500}
      >
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{
            fontSize: '16px',
            color: '#333',
            marginBottom: '20px'
          }}>
            项目邀请码已生成
          </div>
          
          <div style={{
            background: '#f6f8fa',
            border: '2px dashed #d0d7de',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '20px'
          }}>
            <div style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#1890ff',
              letterSpacing: '2px',
              fontFamily: 'monospace'
            }}>
              {inviteCode}
            </div>
          </div>
          
          <div style={{
            fontSize: '14px',
            color: '#666',
            lineHeight: '1.5'
          }}>
            <p>请将邀请码发送给要邀请的用户</p>
            <p>用户可以在项目管理页面点击"参与项目"按钮</p>
            <p>然后输入此邀请码加入项目</p>
          </div>
        </div>
      </Modal>

      {/* 成员信息查看Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <UserOutlined style={{ color: '#1890ff' }} />
            <span>成员信息</span>
          </div>
        }
        open={isMemberInfoModalVisible}
        onCancel={() => setIsMemberInfoModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsMemberInfoModalVisible(false)}>
            关闭
          </Button>
        ]}
        width={600}
      >
        {selectedMember && (
          <div>
            {/* 成员基本信息 */}
            <div style={{
              background: '#f8f9fa',
              borderRadius: 12,
              padding: 20,
              marginBottom: 20,
              border: '1px solid #e9ecef'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                <Avatar 
                  size={60} 
                  icon={<UserOutlined />}
                  style={{ 
                    backgroundColor: '#52c41a',
                    border: '3px solid #fff',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                />
                <div>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#262626' }}>
                    {selectedMember.user_name}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <Tag color="blue">项目成员</Tag>
                    {selectedMember.role === 'owner' && <Tag color="gold">项目负责人</Tag>}
                    {selectedMember.role === 'admin' && <Tag color="purple">管理员</Tag>}
                  </div>
                </div>
              </div>
            </div>

            {/* 详细信息 */}
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <div style={{
                  background: '#f6ffed',
                  borderRadius: 8,
                  padding: 16,
                  border: '1px solid #b7eb8f'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ color: '#52c41a', fontSize: 16 }}>📊</span>
                    <Text strong style={{ fontSize: 14, color: '#262626' }}>
                      贡献比例
                    </Text>
                  </div>
                  <Text style={{ fontSize: 20, fontWeight: 600, color: '#52c41a' }}>
                    {selectedMember.contribution_percentage || 0}%
                  </Text>
                </div>
              </Col>
              <Col span={12}>
                <div style={{
                  background: '#fff7e6',
                  borderRadius: 8,
                  padding: 16,
                  border: '1px solid #ffd591'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ color: '#fa8c16', fontSize: 16 }}>💰</span>
                    <Text strong style={{ fontSize: 14, color: '#262626' }}>
                      股权比例
                    </Text>
                  </div>
                  <Text style={{ fontSize: 20, fontWeight: 600, color: '#fa8c16' }}>
                    {Number(selectedMember.equity_percentage || 0).toFixed(2)}%
                  </Text>
                </div>
              </Col>
            </Row>

            {Number(selectedMember.investment_amount || 0) > 0 && (
              <div style={{
                background: '#e6f7ff',
                borderRadius: 8,
                padding: 16,
                marginTop: 16,
                border: '1px solid #91d5ff'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ color: '#1890ff', fontSize: 16 }}>💵</span>
                  <Text strong style={{ fontSize: 14, color: '#262626' }}>
                    投资金额
                  </Text>
                </div>
                <Text style={{ fontSize: 18, fontWeight: 600, color: '#1890ff' }}>
                  ¥{Number(selectedMember.investment_amount || 0).toFixed(2)}
                </Text>
              </div>
            )}

            {selectedMember.contribution_description && (
              <div style={{
                background: '#fafafa',
                borderRadius: 8,
                padding: 16,
                marginTop: 16,
                border: '1px solid #f0f0f0'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ color: '#8c8c8c', fontSize: 16 }}>📝</span>
                  <Text strong style={{ fontSize: 14, color: '#262626' }}>
                    贡献描述
                  </Text>
                </div>
                <Text style={{ fontSize: 14, color: '#595959', lineHeight: 1.6 }}>
                  {selectedMember.contribution_description}
                </Text>
              </div>
            )}

            <div style={{
              background: '#fafafa',
              borderRadius: 8,
              padding: 16,
              marginTop: 16,
              border: '1px solid #f0f0f0'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ color: '#8c8c8c', fontSize: 16 }}>🕒</span>
                <Text strong style={{ fontSize: 14, color: '#262626' }}>
                  加入时间
                </Text>
              </div>
              <Text style={{ fontSize: 14, color: '#595959' }}>
                {selectedMember.join_date ? new Date(selectedMember.join_date).toLocaleString() : '未知'}
              </Text>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Projects;