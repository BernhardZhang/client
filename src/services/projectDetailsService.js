import api from './api';

class ProjectDetailsService {
  /**
   * 导出项目详情为markdown格式
   * @param {number} projectId - 项目ID
   * @returns {Promise} 返回包含markdown内容的响应
   */
  async exportProjectDetails(projectId) {
    try {
      console.log(`正在导出项目 ${projectId} 的详情...`);

      const response = await api.get(`/projects/${projectId}/export-details/`);

      if (response.data && response.data.success) {
        console.log(`项目 ${projectId} 详情导出成功，数据摘要:`, response.data.data_summary);
        return {
          success: true,
          projectId: response.data.project_id,
          projectName: response.data.project_name,
          structuredContent: response.data.structured_content, // 改为结构化数据
          dataSummary: response.data.data_summary,
          generatedAt: response.data.generated_at
        };
      } else {
        throw new Error('服务器返回了无效的响应格式');
      }
    } catch (error) {
      console.error('导出项目详情失败:', error);

      // 处理不同类型的错误
      if (error.response) {
        const status = error.response.status;
        const errorData = error.response.data;

        switch (status) {
          case 403:
            throw new Error('您没有权限查看此项目的详细信息');
          case 404:
            throw new Error('项目不存在或详情数据收集失败');
          case 500:
            throw new Error(`服务器内部错误: ${errorData.error || '未知错误'}`);
          default:
            throw new Error(`请求失败 (${status}): ${errorData.error || error.message}`);
        }
      } else if (error.request) {
        throw new Error('网络连接失败，请检查您的网络连接');
      } else {
        throw new Error(`请求配置错误: ${error.message}`);
      }
    }
  }

  /**
   * 获取项目详情原始数据（JSON格式）
   * @param {number} projectId - 项目ID
   * @returns {Promise} 返回包含原始数据的响应
   */
  async getRawProjectDetails(projectId) {
    try {
      console.log(`正在获取项目 ${projectId} 的原始详情数据...`);

      const response = await api.get(`/projects/${projectId}/raw-details/`);

      if (response.data && response.data.success) {
        console.log(`项目 ${projectId} 原始数据获取成功`);
        return {
          success: true,
          data: response.data.data
        };
      } else {
        throw new Error('服务器返回了无效的响应格式');
      }
    } catch (error) {
      console.error('获取项目原始详情失败:', error);

      if (error.response) {
        const status = error.response.status;
        const errorData = error.response.data;

        switch (status) {
          case 403:
            throw new Error('您没有权限查看此项目的详细信息');
          case 404:
            throw new Error('项目不存在或详情数据收集失败');
          case 500:
            throw new Error(`服务器内部错误: ${errorData.error || '未知错误'}`);
          default:
            throw new Error(`请求失败 (${status}): ${errorData.error || error.message}`);
        }
      } else if (error.request) {
        throw new Error('网络连接失败，请检查您的网络连接');
      } else {
        throw new Error(`请求配置错误: ${error.message}`);
      }
    }
  }

  /**
   * 检查项目详情数据的完整性
   * @param {Object} projectDetails - 项目详情数据
   * @returns {Object} 返回数据完整性检查结果
   */
  validateProjectDetails(projectDetails) {
    const validation = {
      isValid: true,
      missingFields: [],
      warnings: [],
      score: 0
    };

    if (!projectDetails) {
      validation.isValid = false;
      validation.missingFields.push('整个项目详情数据');
      return validation;
    }

    // 检查基本信息
    if (!projectDetails.project_info) {
      validation.missingFields.push('项目基本信息');
    } else {
      validation.score += 20;
    }

    // 检查成员信息
    if (!projectDetails.members || projectDetails.members.length === 0) {
      validation.warnings.push('项目暂无成员信息');
    } else {
      validation.score += 20;
    }

    // 检查任务信息
    if (!projectDetails.tasks || projectDetails.tasks.total_count === 0) {
      validation.warnings.push('项目暂无任务信息');
    } else {
      validation.score += 20;
    }

    // 检查日志信息
    if (!projectDetails.logs || projectDetails.logs.recent_logs_count === 0) {
      validation.warnings.push('项目暂无活动日志');
    } else {
      validation.score += 20;
    }

    // 检查其他信息
    if (projectDetails.revenue && projectDetails.revenue.revenue_count > 0) {
      validation.score += 10;
    }

    if (projectDetails.merit && projectDetails.merit.merit_records_count > 0) {
      validation.score += 10;
    }

    validation.isValid = validation.missingFields.length === 0;

    return validation;
  }

  /**
   * 格式化项目详情摘要
   * @param {Object} dataSummary - 数据摘要
   * @returns {string} 格式化的摘要文本
   */
  formatDataSummary(dataSummary) {
    if (!dataSummary) return '数据摘要不可用';

    const parts = [];

    if (dataSummary.members_count > 0) {
      parts.push(`${dataSummary.members_count}个成员`);
    }

    if (dataSummary.tasks_count > 0) {
      parts.push(`${dataSummary.tasks_count}个任务`);
    }

    if (dataSummary.revenue_count > 0) {
      parts.push(`${dataSummary.revenue_count}条收益记录`);
    }

    if (dataSummary.logs_count > 0) {
      parts.push(`${dataSummary.logs_count}条活动日志`);
    }

    if (dataSummary.merit_points > 0) {
      parts.push(`${dataSummary.merit_points}功分`);
    }

    return parts.length > 0 ? parts.join('，') : '暂无数据';
  }

  /**
   * 生成项目详情摘要信息（用于AI分析前的预览）
   * @param {Object} projectDetails - 项目详情数据
   * @returns {string} 生成的摘要文本
   */
  generateProjectSummary(projectDetails) {
    if (!projectDetails || !projectDetails.structuredContent) {
      return '项目信息不完整，无法生成摘要。';
    }

    const structuredContent = projectDetails.structuredContent;
    const projectInfo = structuredContent['项目基本信息'];
    const teamInfo = structuredContent['团队信息'];
    const taskInfo = structuredContent['任务执行情况'];

    if (!projectInfo) {
      return '项目基本信息不完整，无法生成摘要。';
    }

    let summary = `项目"${projectInfo['项目名称']}"是一个${projectInfo['项目类型']}项目，当前状态为${projectInfo['当前状态']}，进度${projectInfo['项目进度']}。`;

    if (teamInfo && teamInfo['成员总数'] > 0) {
      summary += `项目团队有${teamInfo['成员总数']}个成员，`;
      summary += `负责人是${projectInfo['项目负责人']}。`;
    }

    if (taskInfo && taskInfo['任务总数'] > 0) {
      summary += `项目包含${taskInfo['任务总数']}个任务。`;
      if (taskInfo['任务状态分布']) {
        const completed = taskInfo['任务状态分布']['已完成'] || 0;
        const inProgress = taskInfo['任务状态分布']['进行中'] || 0;
        summary += `其中${completed}个已完成，${inProgress}个正在进行中。`;
      }
    }

    return summary;
  }
}

// 导出单例实例
const projectDetailsService = new ProjectDetailsService();
export default projectDetailsService;