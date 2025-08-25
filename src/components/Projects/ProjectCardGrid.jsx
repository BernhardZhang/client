import React from 'react';
import { Row, Col, Empty, Spin } from 'antd';
import ProjectCard from './ProjectCard';

const ProjectCardGrid = ({
  projects = [],
  loading = false,
  pinnedProjects = [],
  isProjectOwner,
  isProjectMember,
  onPin,
  onView,
  onEdit,
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
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!projects || projects.length === 0) {
    return (
      <Empty
        description="暂无项目"
        style={{ margin: '60px 0' }}
      />
    );
  }

  return (
    <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
      {projects.map((project) => (
        <Col
          key={project.id}
          xs={24}    // 手机：1列
          sm={12}    // 小屏：2列
          md={8}     // 中屏：3列
          lg={6}     // 大屏：4列
          xl={6}     // 超大屏：4列
          xxl={4}    // 超超大屏：6列
        >
          <ProjectCard
            project={project}
            isOwner={isProjectOwner(project)}
            isMember={isProjectMember(project)}
            isPinned={pinnedProjects.includes(project.id)}
            onPin={onPin}
            onView={onView}
            onEdit={onEdit}
            onJoin={onJoin}
            onLeave={onLeave}
            onManageTasks={onManageTasks}
            onManageEvaluation={onManageEvaluation}
            onManageRecruitment={onManageRecruitment}
            onManageRevenue={onManageRevenue}
            onManageTeam={onManageTeam}
            onManageAnalytics={onManageAnalytics}
            onManageVoting={onManageVoting}
          />
        </Col>
      ))}
    </Row>
  );
};

export default ProjectCardGrid;