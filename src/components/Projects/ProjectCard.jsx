import React, { useState, useEffect } from 'react';
import { Card, Tag, Avatar, Progress, Button, Space, Tooltip, Badge, Typography, Modal, App } from 'antd';
import useTaskStore from '../../stores/taskStore';
import {
  TeamOutlined,
  StarFilled,
  StarOutlined,
  SettingOutlined,
  CheckSquareOutlined,
  BarChartOutlined,
  UserAddOutlined,
  DollarOutlined,
  EyeOutlined,
  ProjectOutlined,
  InfoCircleOutlined,
  UsergroupAddOutlined,
  LikeOutlined,
  DeleteOutlined,
} from '@ant-design/icons';

const { Text, Title } = Typography;

const ProjectCard = ({
  project,
  isOwner,
  isMember,
  isPinned,
  onPin,
  onView,
  onEdit,
  onDelete,
  onJoin,
  onLeave,
  onManageTasks,
  onManageEvaluation,
  onManageRecruitment,
  onManageRevenue,
  onManageTeam,
  onManageAnalytics,
  onManageVoting,
}) => {
  const { modal } = App.useApp();
  const { tasks, fetchTasks } = useTaskStore();

  // 在组件加载时获取所有任务数据
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // 计算项目的任务总占比 - 从 taskStore 中获取任务数据
  const calculateTasksProgress = (projectId) => {
    console.log('ProjectCard 计算项目任务进度 - 项目ID:', projectId);
    console.log('ProjectCard 全部任务数据:', tasks);

    // 过滤出属于当前项目的任务
    const projectTasks = tasks.filter(task => task.project === projectId);
    console.log('ProjectCard 当前项目的任务:', projectTasks);

    const totalProgress = projectTasks.reduce((total, task) => {
      console.log('ProjectCard 任务:', task.title, '占比:', task.progress);
      return total + (task.progress || 0);
    }, 0);

    // 确保总进度不超过100%
    const clampedProgress = Math.min(totalProgress, 100);
    console.log('ProjectCard 计算出的总进度:', totalProgress, '限制后的进度:', clampedProgress);
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

  // 调试信息
  console.log('ProjectCard received project:', project);
  console.log('Project name:', project?.name);
  console.log('Project owner:', project?.owner);
  console.log('isOwner:', isOwner);
  console.log('onDelete function:', onDelete);
  console.log('Delete button should be visible:', isOwner);

  // 处理删除操作
  const handleDeleteClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    console.log('删除按钮被点击，项目ID:', project.id);
    console.log('modal对象:', modal);
    
    if (!onDelete) {
      console.error('onDelete函数未定义');
      return;
    }
    
    // 使用现代的 modal hooks API
    console.log('即将显示Modal确认对话框');
    modal.confirm({
      title: '确定要删除这个项目吗？',
      content: `项目"${project.name}"将被永久删除，此操作不可撤销。`,
      okText: '确定删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        console.log('确认删除，调用onDelete函数');
        try {
          await onDelete(project.id);
        } catch (error) {
          console.error('删除项目时出错:', error);
        }
      },
      onCancel: () => {
        console.log('取消删除操作');
      },
    });
    console.log('modal.confirm已调用');
  };
  const getStatusColor = (status) => {
    const statusConfig = {
      active: '#52c41a',
      completed: '#1890ff',
      pending: '#faad14',
    };
    return statusConfig[status] || '#d9d9d9';
  };

  const getStatusText = (status) => {
    const statusConfig = {
      active: '进行中',
      completed: '已完成',
      pending: '待审核',
    };
    return statusConfig[status] || '未知';
  };

  // 根据项目类型获取主题色
  const getProjectThemeColor = () => {
    if (isOwner) {
      return '#1890ff'; // 蓝色 - 自己创建的项目
    } else if (isMember) {
      return '#52c41a'; // 绿色 - 被邀请参与的项目
    } else {
      return '#8c8c8c'; // 灰色 - 其他项目
    }
  };

  return (
    <Card
      className="project-card"
      hoverable
      style={{
        height: 360,
        borderRadius: 12,
        boxShadow: '0 4px 20px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.1)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        cursor: 'pointer',
        border: `1px solid ${getProjectThemeColor()}20`,
        overflow: 'hidden',
      }}
      bodyStyle={{ 
        padding: 20, 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        background: '#ffffff'
      }}
      onClick={() => onView(project)}
      actions={[
        <Tooltip title="基本信息">
          <Button
            type="text"
            icon={<InfoCircleOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              onView(project);
            }}
            style={{ 
              color: '#1890ff',
              width: '100%',
              height: 40,
              borderRadius: 0,
              border: 'none'
            }}
          />
        </Tooltip>,
        <Tooltip title="任务管理">
          <Button
            type="text"
            icon={<CheckSquareOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              onManageTasks(project);
            }}
            style={{ 
              color: '#52c41a',
              width: '100%',
              height: 40,
              borderRadius: 0,
              border: 'none'
            }}
          />
        </Tooltip>,
        <Tooltip title="团队管理">
          <Button
            type="text"
            icon={<UsergroupAddOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              onManageTeam ? onManageTeam(project) : onManageEvaluation(project);
            }}
            style={{ 
              color: '#722ed1',
              width: '100%',
              height: 40,
              borderRadius: 0,
              border: 'none'
            }}
          />
        </Tooltip>,
        <Tooltip title="数据分析">
          <Button
            type="text"
            icon={<BarChartOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              onManageAnalytics ? onManageAnalytics(project) : onManageRevenue(project);
            }}
            style={{ 
              color: '#fa8c16',
              width: '100%',
              height: 40,
              borderRadius: 0,
              border: 'none'
            }}
          />
        </Tooltip>,
        <Tooltip title="项目投票">
          <Button
            type="text"
            icon={<LikeOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              onManageVoting(project);
            }}
            style={{ 
              color: '#eb2f96',
              width: '100%',
              height: 40,
              borderRadius: 0,
              border: 'none'
            }}
          />
        </Tooltip>,
      ]}
    >
      {/* 置顶标识 */}
      {isPinned && (
        <StarFilled
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            color: '#faad14',
            fontSize: 16,
            zIndex: 1,
          }}
        />
      )}

      {/* 项目图标和状态 */}
      <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 12 }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 8,
            background: `linear-gradient(135deg, ${getProjectThemeColor()}20, ${getProjectThemeColor()}40)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
            border: `2px solid ${getProjectThemeColor()}30`,
            boxShadow: `0 4px 12px ${getProjectThemeColor()}25, inset 0 1px 0 rgba(255,255,255,0.2)`,
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: -2,
              left: -2,
              right: -2,
              bottom: -2,
              borderRadius: 10,
              background: `linear-gradient(45deg, ${getProjectThemeColor()}40, transparent, ${getProjectThemeColor()}40)`,
              opacity: 0.6,
              zIndex: -1,
            }}
          />
          <ProjectOutlined style={{ fontSize: 24, color: getProjectThemeColor(), filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ marginBottom: 6 }}>
            <Space wrap>
              <Tag 
                color={getStatusColor(project.status)} 
                style={{ 
                  margin: 0, 
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 600,
                  border: 'none',
                  background: `linear-gradient(135deg, ${getStatusColor(project.status)}15, ${getStatusColor(project.status)}25)`,
                  color: getStatusColor(project.status),
                  boxShadow: `0 2px 8px ${getStatusColor(project.status)}20`,
                  textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                }}
              >
                {getStatusText(project.status)}
              </Tag>
              {project.project_type && (
                <Tag 
                  color="default" 
                  style={{ 
                    margin: 0, 
                    fontSize: 10,
                    borderRadius: 6,
                    background: 'linear-gradient(135deg, #f1f5f9, #e2e8f0)',
                    color: '#475569',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    fontWeight: 500,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                  }}
                >
                  {project.project_type}
                </Tag>
              )}
            </Space>
          </div>
        </div>
      </div>

      {/* 项目标题 */}
      <Title 
        level={4} 
        style={{ 
          margin: '0 0 8px 0', 
          fontSize: 16,
          lineHeight: '24px',
          minHeight: 24,
          maxHeight: 48,
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          fontWeight: 600,
          color: '#262626',
        }}
        title={project.name}
      >
        {project.name || '未命名项目'}
      </Title>

      {/* 项目描述 */}
      <Text 
        type="secondary" 
        style={{ 
          fontSize: 12,
          lineHeight: '18px',
          minHeight: 18,
          maxHeight: 36,
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          marginBottom: 12,
          color: '#8c8c8c',
        }}
        title={project.description}
      >
        {project.description || '暂无描述'}
      </Text>

      {/* 项目进度 */}
      <div style={{ marginBottom: 12 }}>
        {(() => {
          const tasksProgress = calculateTasksProgress(project.id);
          const strokeColor = getProgressStrokeColor(tasksProgress);
          const unallocatedProgress = Math.max(0, 100 - tasksProgress);

          return (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <Text style={{ fontSize: 12, color: '#595959', fontWeight: 500 }}>项目进度</Text>
                <Text style={{ fontSize: 12, fontWeight: 600, color: getStatusColor(project.status) }}>{tasksProgress}%</Text>
              </div>
              <Progress
                percent={100}
                size="small"
                status={tasksProgress === 100 ? 'success' : 'active'}
                strokeColor={strokeColor}
                style={{
                  '& .ant-progress-bg': {
                    borderRadius: '4px !important',
                  }
                }}
              />
              <div style={{ fontSize: '10px', color: '#8c8c8c', marginTop: 4, display: 'flex', justifyContent: 'space-between' }}>
                <span>任务: {tasksProgress}%</span>
                {unallocatedProgress > 0 && (
                  <span>未分配: {unallocatedProgress}%</span>
                )}
              </div>
            </>
          );
        })()}
      </div>

      {/* 项目信息 */}
      <div style={{ marginBottom: 12, flex: 1 }}>
        <div style={{ 
          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', 
          borderRadius: 8, 
          padding: 12, 
          border: '1px solid rgba(148, 163, 184, 0.2)',
          boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.05)',
          position: 'relative',
        }}>
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 1,
              background: 'linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.3), transparent)',
            }}
          />
          <Space direction="vertical" size={6} style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Space size={4}>
                <div style={{
                  width: 16,
                  height: 16,
                  borderRadius: 4,
                  background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)'
                }}>
                  <TeamOutlined style={{ fontSize: 10, color: '#ffffff' }} />
                </div>
                <Text style={{ fontSize: 12, color: '#475569', fontWeight: 600 }}>成员</Text>
              </Space>
              <Text style={{ fontSize: 12, fontWeight: 700, color: '#1e293b', textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>{project.member_count || 0}人</Text>
            </div>

            {project.tasks_count && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Space size={4}>
                  <div style={{
                    width: 16,
                    height: 16,
                    borderRadius: 4,
                    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 4px rgba(245, 158, 11, 0.3)'
                  }}>
                    <CheckSquareOutlined style={{ fontSize: 10, color: '#ffffff' }} />
                  </div>
                  <Text style={{ fontSize: 12, color: '#475569', fontWeight: 600 }}>任务</Text>
                </Space>
                <Text style={{ fontSize: 12, fontWeight: 700, color: '#1e293b', textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
                  {project.completed_tasks || 0}/{project.tasks_count}
                </Text>
              </div>
            )}
          </Space>
        </div>
      </div>

      {/* 负责人信息 */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginTop: 'auto',
        paddingTop: 12,
        borderTop: '1px solid rgba(148, 163, 184, 0.2)',
        position: 'relative',
      }}>
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 1,
            background: 'linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.2), transparent)',
          }}
        />
        <Space size={10}>
          <div style={{ position: 'relative' }}>
            <Avatar 
              size={28} 
              style={{ 
                backgroundColor: getProjectThemeColor(),
                border: '2px solid #fff',
                boxShadow: `0 4px 12px ${getProjectThemeColor()}30, 0 2px 4px rgba(0,0,0,0.1)`
              }}
            >
              {project.owner_name?.[0]?.toUpperCase() || 'U'}
            </Avatar>
            <div
              style={{
                position: 'absolute',
                top: -2,
                left: -2,
                right: -2,
                bottom: -2,
                borderRadius: 16,
                background: `linear-gradient(45deg, ${getProjectThemeColor()}40, transparent, ${getProjectThemeColor()}40)`,
                opacity: 0.4,
                zIndex: -1,
              }}
            />
          </div>
          <div>
            <Text style={{ fontSize: 11, color: '#64748b', display: 'block', fontWeight: 500 }}>负责人</Text>
            <Text style={{ fontSize: 13, color: '#1e293b', fontWeight: 600, textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>{project.owner_name}</Text>
          </div>
        </Space>
        
        <Space size={2}>
          <Button
            type="text"
            size="small"
            icon={isPinned ? <StarFilled /> : <StarOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              onPin(project.id);
            }}
            style={{ 
              color: isPinned ? '#f59e0b' : '#94a3b8',
              width: 32,
              height: 32,
              borderRadius: 6,
              background: isPinned ? 'linear-gradient(135deg, #fef3c7, #fde68a)' : 'transparent',
              boxShadow: isPinned ? '0 2px 8px rgba(245, 158, 11, 0.3)' : 'none',
              transition: 'all 0.2s ease'
            }}
          />
          {isOwner && (
            <Button
              type="text"
              size="small"
              icon={<SettingOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                onEdit(project);
              }}
              style={{ 
                color: '#64748b',
                width: 32,
                height: 32,
                borderRadius: 6,
                transition: 'all 0.2s ease'
              }}
            />
          )}
          {isOwner && (
            <Button
              type="text"
              size="small"
              icon={<DeleteOutlined />}
              onClick={handleDeleteClick}
              style={{ 
                color: '#ef4444',
                width: 32,
                height: 32,
                borderRadius: 6,
                transition: 'all 0.2s ease',
                position: 'relative',
                zIndex: 999,
                pointerEvents: 'auto'
              }}
            />
          )}
        </Space>
      </div>

      {/* 卡片样式 */}
      <style jsx>{`
        .project-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.12), 0 4px 10px rgba(0,0,0,0.08) !important;
          border-color: ${getProjectThemeColor()}40;
        }
        .project-card .ant-card-actions {
          border-top: 1px solid rgba(148, 163, 184, 0.2);
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          margin: 0;
          padding: 0;
        }
        .project-card .ant-card-actions > li {
          margin: 0;
          border-right: 1px solid rgba(148, 163, 184, 0.15);
        }
        .project-card .ant-card-actions > li:last-child {
          border-right: none;
        }
        .project-card .ant-card-actions > li > span {
          display: flex;
          justify-content: center;
          align-items: center;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .project-card .ant-card-actions > li:hover > span {
          background: linear-gradient(135deg, #e2e8f0, #cbd5e1);
          box-shadow: inset 0 1px 3px rgba(0,0,0,0.1);
        }
        .project-card .ant-progress-bg {
          border-radius: 6px !important;
          background: linear-gradient(90deg, #e2e8f0, #cbd5e1) !important;
        }
        .project-card .ant-progress-inner {
          border-radius: 6px !important;
        }
        .project-card .ant-progress-success-bg {
          background: linear-gradient(90deg, #10b981, #059669) !important;
        }
        .project-card .ant-progress-bg {
          background: linear-gradient(90deg, #3b82f6, #1d4ed8) !important;
        }
        .project-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, ${getProjectThemeColor()}, ${getProjectThemeColor()}80, ${getProjectThemeColor()});
          background-size: 200% 100%;
          animation: shimmer 3s ease-in-out infinite;
          opacity: 0.6;
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </Card>
  );
};

export default ProjectCard;