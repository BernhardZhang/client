import api from './api';

// 项目相关的辅助 API 方法
export const projectHelpers = {
  // 通过邀请码加入项目
  joinByCode: async (joinCode) => {
    try {
      const response = await api.post('/projects/join-by-code/', { join_code: joinCode });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Join project by code error:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || '参与项目失败';
      return { success: false, error: errorMessage };
    }
  },

  // 生成项目邀请码
  generateInviteCode: async (projectId) => {
    try {
      const response = await api.post(`/projects/${projectId}/generate-invite-code/`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Generate invite code error:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || '生成邀请码失败';
      return { success: false, error: errorMessage };
    }
  }
};
