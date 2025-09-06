import { create } from 'zustand';
import { projectsAPI } from '../services/api';

const useProjectStore = create((set, get) => ({
  projects: [],
  currentProject: null,
  isLoading: false,
  
  fetchProjects: async () => {
    set({ isLoading: true });
    try {
      const response = await projectsAPI.getProjects();
      // 处理分页格式的响应
      const projects = response.data.results || response.data || [];
      set({ projects: Array.isArray(projects) ? projects : [], isLoading: false });
    } catch (error) {
      console.error('Fetch projects error:', error);
      set({ projects: [], isLoading: false }); // 确保projects始终是数组
    }
  },
  
  createProject: async (projectData) => {
    set({ isLoading: true });
    try {
      const response = await projectsAPI.createProject(projectData);
      const newProject = response.data;
      
      // 重新获取项目列表以确保数据一致性
      const { fetchProjects } = get();
      await fetchProjects();
      
      return { success: true, project: newProject };
    } catch (error) {
      set({ isLoading: false });
      console.error('创建项目错误:', error);
      return { 
        success: false, 
        error: error.response?.data || '创建项目失败' 
      };
    }
  },

  updateProject: async (id, projectData) => {
    set({ isLoading: true });
    try {
      const response = await projectsAPI.updateProject(id, projectData);
      const updatedProject = response.data;
      
      // 重新获取项目列表以确保数据一致性
      const { fetchProjects } = get();
      await fetchProjects();
      
      return { success: true, project: updatedProject };
    } catch (error) {
      set({ isLoading: false });
      console.error('更新项目错误:', error);
      return { 
        success: false, 
        error: error.response?.data || '更新项目失败' 
      };
    }
  },

  deleteProject: async (id) => {
    set({ isLoading: true });
    try {
      const response = await projectsAPI.deleteProject(id);
      console.log('Delete project response:', response);
      
      // 项目删除成功，从列表中移除
      const { projects } = get();
      const updatedProjects = Array.isArray(projects) 
        ? projects.filter(p => p.id !== id)
        : [];
      set({ projects: updatedProjects, isLoading: false });
      
      return { 
        success: true, 
        message: response.data?.message || '项目删除成功' 
      };
    } catch (error) {
      console.error('删除项目错误:', error);
      
      // 处理成功的响应状态码 (200-299 范围)
      if (error.response?.status >= 200 && error.response?.status < 300) {
        console.log('Project deleted successfully (HTTP success status)');
        const { projects } = get();
        const updatedProjects = Array.isArray(projects) 
          ? projects.filter(p => p.id !== id)
          : [];
        set({ projects: updatedProjects, isLoading: false });
        return { 
          success: true, 
          message: error.response.data?.message || '项目删除成功' 
        };
      }
      
      // 处理204无内容响应 (删除成功但无响应体)
      if (error.response?.status === 204) {
        console.log('Project deleted successfully (204 No Content)');
        const { projects } = get();
        const updatedProjects = Array.isArray(projects) 
          ? projects.filter(p => p.id !== id)
          : [];
        set({ projects: updatedProjects, isLoading: false });
        return { success: true, message: '项目删除成功' };
      }
      
      set({ isLoading: false });
      
      // 错误处理
      let errorMessage = '删除项目失败';
      
      // 处理403权限错误
      if (error.response?.status === 403) {
        errorMessage = '您没有权限删除此项目，只有项目所有者可以删除项目';
      } else if (error.response?.data) {
        if (error.response.data.error) {
          errorMessage = error.response.data.error;
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return { 
        success: false, 
        error: errorMessage
      };
    }
  },
  
  fetchProject: async (id) => {
    set({ isLoading: true });
    try {
      const response = await projectsAPI.getProject(id);
      const project = response.data;
      set({ currentProject: project, isLoading: false });
      return { success: true, data: project };
    } catch (error) {
      console.error('Fetch project error:', error);
      set({ isLoading: false });
      return { success: false, error: error.response?.data || '获取项目信息失败' };
    }
  },
  
  joinProject: async (projectId) => {
    try {
      const response = await projectsAPI.joinProject(projectId);
      
      // 重新获取项目列表以显示最新状态
      const { fetchProjects } = get();
      await fetchProjects();
      
      return { success: true, message: response.data.message };
    } catch (error) {
      console.error('加入项目错误:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || error.response?.data?.error || '加入项目失败' 
      };
    }
  },
  
  leaveProject: async (projectId) => {
    try {
      const response = await projectsAPI.leaveProject(projectId);
      
      // 重新获取项目列表以显示最新状态
      const { fetchProjects } = get();
      await fetchProjects();
      
      return { success: true, message: response.data.message };
    } catch (error) {
      console.error('退出项目错误:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || error.response?.data?.error || '退出项目失败' 
      };
    }
  },
}));

export default useProjectStore;