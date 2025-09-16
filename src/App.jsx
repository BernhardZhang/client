import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, App as AntdApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import ResponsiveLayout from './components/Layout/ResponsiveLayout';
import Dashboard from './components/Dashboard/Dashboard';
import IntegratedProjectManagement from './components/Projects/IntegratedProjectManagement';
import Points from './components/Points/Points';
import Finance from './components/Finance/Finance';
import Merit from './components/Merit/Merit';
import ProjectHall from './components/Projects/ProjectHall';
import TasksPage from './components/Tasks/TasksPage';
import DataAnalysis from './components/Analysis/DataAnalysis';
import PublicHome from './components/Public/PublicHome';
import PublicProject from './components/Public/PublicProject';
import useAuthStore from './stores/authStore';
import 'antd/dist/reset.css';
import './App.css';
import './styles/responsive.css';

// 游客模式路由 - 允许未登录用户访问的页面
const PublicRoute = ({ children }) => {
  return children;
};

// 受保护的路由 - 需要登录才能访问
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated() ? children : <Navigate to="/" />;
};

function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <ConfigProvider locale={zhCN}>
      <AntdApp>
        <Router>
          <div className="App">
            <Routes>
              {/* 首页使用新的左中右布局 */}
              <Route path="/" element={<PublicHome />} />
              
              {/* 项目管理页面使用新的左中右布局 */}
              <Route path="/projects" element={<IntegratedProjectManagement />} />
              
              {/* 项目大厅页面使用新的左中右布局 */}
              <Route path="/project-hall" element={<ProjectHall />} />
              
              {/* 积分系统页面使用新的左中右布局 */}
              <Route path="/points" element={<Points />} />
              
              {/* 财务管理页面使用新的左中右布局 */}
              <Route path="/finance" element={<Finance />} />
              
              {/* 数据分析页面使用新的左中右布局 */}
              <Route path="/evaluation" element={<DataAnalysis />} />

              {/* 其他页面使用ResponsiveLayout */}
              <Route path="/dashboard" element={<ResponsiveLayout />}>
                <Route index element={<Dashboard />} />
              </Route>
              
              {/* 项目详情页 */}
              <Route path="/projects/:projectId" element={<PublicRoute><TasksPage /></PublicRoute>} />
              <Route path="/public/projects/:projectId" element={<PublicRoute><PublicProject /></PublicRoute>} />
              
              {/* 兼容旧路由 */}
              <Route path="/public" element={<Navigate to="/" />} />
              <Route path="/app/*" element={<Navigate to="/" />} />
              <Route path="/login" element={<Navigate to="/" />} />
              <Route path="/register" element={<Navigate to="/" />} />
            </Routes>
          </div>
        </Router>
      </AntdApp>
    </ConfigProvider>
  )
}

export default App
