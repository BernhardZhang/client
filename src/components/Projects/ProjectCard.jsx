import React from 'react';
import { Card, Tag, Avatar, Progress, Button, Space, Tooltip, Badge, Typography, Modal } from 'antd';
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

  return (
    <Card
      className="project-card"
      hoverable
      style={{
        height: 320,
        borderRadius: 12,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        transition: 'all 0.3s ease',
        position: 'relative',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      }}
      bodyStyle={{ padding: 16, height: '100%', display: 'flex', flexDirection: 'column' }}
      actions={[
        <Tooltip title="基本信息">
          <Button
            type="text"
            icon={<InfoCircleOutlined />}
            onClick={() => onView(project)}
            style={{ color: '#1890ff' }}
          />
        </Tooltip>,
        <Tooltip title="任务管理">
          <Button
            type="text"
            icon={<CheckSquareOutlined />}
            onClick={() => onManageTasks(project)}
            style={{ color: '#52c41a' }}
          />
        </Tooltip>,
        <Tooltip title="团队管理">
          <Button
            type="text"
            icon={<UsergroupAddOutlined />}
            onClick={() => onManageTeam ? onManageTeam(project) : onManageEvaluation(project)}
            style={{ color: '#722ed1' }}
          />
        </Tooltip>,
        <Tooltip title="数据分析">
          <Button
            type="text"
            icon={<BarChartOutlined />}
            onClick={() => onManageAnalytics ? onManageAnalytics(project) : onManageRevenue(project)}
            style={{ color: '#fa8c16' }}
          />
        </Tooltip>,
        <Tooltip title="项目投票">
          <Button
            type="text"
            icon={<LikeOutlined />}
            onClick={() => onManageVoting(project)}
            style={{ color: '#eb2f96' }}
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
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 8,
            background: `linear-gradient(135deg, ${getStatusColor(project.status)}22, ${getStatusColor(project.status)}44)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
          }}
        >
          <ProjectOutlined style={{ fontSize: 24, color: getStatusColor(project.status) }} />
        </div>
        <div style={{ flex: 1 }}>
          <Space style={{ marginBottom: 4 }}>
            <Tag color={getStatusColor(project.status)} style={{ margin: 0 }}>
              {getStatusText(project.status)}
            </Tag>
            {project.project_type && (
              <Tag color="blue" style={{ margin: 0, fontSize: 11 }}>
                {project.project_type}
              </Tag>
            )}
          </Space>
        </div>
      </div>

      {/* 项目标题 */}
      <Title 
        level={4} 
        style={{ 
          margin: '0 0 8px 0', 
          fontSize: 16,
          lineHeight: '24px',
          height: 48,
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
        }}
        title={project.name}
      >
        {project.name}
      </Title>

      {/* 项目描述 */}
      <Text 
        type="secondary" 
        style={{ 
          fontSize: 12,
          lineHeight: '18px',
          height: 36,
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          marginBottom: 12,
        }}
        title={project.description}
      >
        {project.description || '暂无描述'}
      </Text>

      {/* 项目进度 */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <Text style={{ fontSize: 12, color: '#666' }}>项目进度</Text>
          <Text style={{ fontSize: 12, fontWeight: 500 }}>{project.progress || 0}%</Text>
        </div>
        <Progress 
          percent={project.progress || 0} 
          size="small" 
          status={project.progress === 100 ? 'success' : 'active'}
          strokeColor={getStatusColor(project.status)}
        />
      </div>

      {/* 项目信息 */}
      <div style={{ marginBottom: 12, flex: 1 }}>
        <Space direction="vertical" size={4} style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Space size={4}>
              <TeamOutlined style={{ fontSize: 12, color: '#666' }} />
              <Text style={{ fontSize: 12, color: '#666' }}>成员</Text>
            </Space>
            <Text style={{ fontSize: 12, fontWeight: 500 }}>{project.member_count || 0}人</Text>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Space size={4}>
              <DollarOutlined style={{ fontSize: 12, color: '#666' }} />
              <Text style={{ fontSize: 12, color: '#666' }}>估值</Text>
            </Space>
            <Text style={{ fontSize: 12, fontWeight: 500, color: '#722ed1' }}>
              ¥{Number(project.valuation || 0).toFixed(0)}
            </Text>
          </div>

          {project.tasks_count && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Space size={4}>
                <CheckSquareOutlined style={{ fontSize: 12, color: '#666' }} />
                <Text style={{ fontSize: 12, color: '#666' }}>任务</Text>
              </Space>
              <Text style={{ fontSize: 12, fontWeight: 500 }}>
                {project.completed_tasks || 0}/{project.tasks_count}
              </Text>
            </div>
          )}
        </Space>
      </div>

      {/* 负责人信息 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
        <Space size={8}>
          <Avatar size={24} style={{ backgroundColor: getStatusColor(project.status) }}>
            {project.owner_name?.[0]?.toUpperCase() || 'U'}
          </Avatar>
          <Text style={{ fontSize: 12, color: '#666' }}>{project.owner_name}</Text>
        </Space>
        
        <Space size={4}>
          <Button
            type="text"
            size="small"
            icon={isPinned ? <StarFilled /> : <StarOutlined />}
            onClick={() => onPin(project.id)}
            style={{ color: isPinned ? '#faad14' : '#d9d9d9' }}
          />
          {isOwner && (
            <Button
              type="text"
              size="small"
              icon={<SettingOutlined />}
              onClick={() => onEdit(project)}
              style={{ color: '#666' }}
            />
          )}
          {isOwner && (
            <Button
              type="text"
              size="small"
              icon={<DeleteOutlined />}
              onClick={() => {
                Modal.confirm({
                  title: '确定要删除这个项目吗？',
                  content: `项目"${project.name}"将被永久删除，此操作不可撤销。`,
                  okText: '确定删除',
                  okType: 'danger',
                  cancelText: '取消',
                  onOk: async () => {
                    await onDelete(project.id);
                  },
                });
              }}
              style={{ color: '#ff4d4f' }}
            />
          )}
        </Space>
      </div>

      {/* 卡片样式 */}
      <style jsx>{`
        .project-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.15) !important;
        }
        .project-card .ant-card-actions {
          border-top: 1px solid #f0f0f0;
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(10px);
        }
        .project-card .ant-card-actions > li {
          margin: 4px 0;
        }
        .project-card .ant-card-actions > li > span {
          display: flex;
          justify-content: center;
          align-items: center;
        }
      `}</style>
    </Card>
  );
};

export default ProjectCard;