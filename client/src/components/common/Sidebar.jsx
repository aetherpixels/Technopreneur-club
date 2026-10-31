import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  UserSquare2, 
  Users, 
  GraduationCap, 
  CalendarPlus, 
  CalendarRange, 
  Archive, 
  UploadCloud, 
  FileBadge, 
  CalendarCheck,
  Film
} from 'lucide-react';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { user } = useAuth();
  
  if (!user) return null;

  // Define sidebar menu options based on role
  const menuConfig = {
    Admin: [
      { path: '/admin', name: 'Dashboard', icon: LayoutDashboard },
      { path: '/admin/faculty', name: 'Manage Faculty', icon: Users },
      { path: '/admin/students', name: 'Manage Students', icon: GraduationCap },
      { path: '/admin/admins', name: 'Manage Admins', icon: Users },
      { path: '/admin/add-faculty', name: 'Add Faculty', icon: CalendarPlus },
      { path: '/admin/add-student', name: 'Add Student', icon: CalendarPlus },
      { path: '/admin/add-admin', name: 'Add Admin', icon: CalendarPlus },
      { path: '/media', name: 'Media Gallery', icon: Film },
      { path: '/faculty/manage-media', name: 'Manage Media', icon: UploadCloud },
      { path: '/faculty/documents', name: 'Document Library', icon: FileBadge },
      { path: '/faculty/upload', name: 'Manage Documents', icon: UploadCloud }
    ],
    Faculty: [
      { path: '/faculty', name: 'Dashboard', icon: LayoutDashboard },
      { path: '/faculty/create-event', name: 'Create Event', icon: CalendarPlus },
      { path: '/faculty/manage-events', name: 'Manage Events', icon: CalendarRange },
      { path: '/faculty/certificate-setup', name: 'Certificate Setup', icon: FileBadge },
      { path: '/faculty/attendance', name: 'Attendance Marking', icon: UserSquare2 },
      { path: '/faculty/completed', name: 'Completed Events', icon: Archive },
      { path: '/faculty/manage-media', name: 'Manage Media', icon: UploadCloud },
      { path: '/media', name: 'Media Gallery', icon: Film },
      { path: '/faculty/upload', name: 'Manage Documents', icon: UploadCloud },
      { path: '/faculty/documents', name: 'Document Library', icon: FileBadge }
    ],
    Student: [
      { path: '/student', name: 'Dashboard', icon: LayoutDashboard },
      { path: '/student/upcoming', name: 'Upcoming Events', icon: CalendarCheck },
      { path: '/student/registered', name: 'Registered Events', icon: CalendarRange },
      { path: '/student/completed', name: 'Completed Events', icon: Archive },
      { path: '/media', name: 'Media Gallery', icon: Film },
      { path: '/student/certificates', name: 'Certificate Download', icon: FileBadge }
    ]
  };

  const menuItems = menuConfig[user.role] || [];

  return (
    <aside 
      className={`sidebar-transition fixed bottom-0 top-16 left-0 z-30 w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 pt-3 transition-colors duration-200
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}
    >
      <div className="flex h-full flex-col justify-between px-3 pb-4">
        <ul className="space-y-1.5 font-medium">
          {menuItems.map((item) => {
            const Icon = item.icon;
            
            if (item.name === 'Logout') {
              return (
                <li key={item.path}>
                  <button
                    onClick={() => {
                      localStorage.removeItem('token');
                      localStorage.removeItem('user');
                      window.location.href = '/login';
                    }}
                    className="flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-xs font-bold transition-all duration-200 text-slate-600 dark:text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                  >
                    <Icon className="h-4 w-4 stroke-[2.2]" />
                    <span>{item.name}</span>
                  </button>
                </li>
              );
            }

            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  end
                  className={({ isActive }) => `
                    flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-xs font-bold transition-all duration-200
                    ${isActive 
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' 
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'}
                  `}
                >
                  <Icon className="h-4 w-4 stroke-[2.2]" />
                  <span>{item.name}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
};

export default Sidebar;
