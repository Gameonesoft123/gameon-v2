
import React, { useEffect } from 'react';

interface SuperAdminThemeProps {
  children: React.ReactNode;
}

// This component applies the dark theme styling for Super Admin pages
const SuperAdminTheme: React.FC<SuperAdminThemeProps> = ({ children }) => {
  // Apply dark theme when component mounts
  useEffect(() => {
    // Add dark theme class to body
    document.documentElement.classList.add('super-admin-theme');
    
    // Remove theme when component unmounts
    return () => {
      document.documentElement.classList.remove('super-admin-theme');
    };
  }, []);

  return (
    <div className="super-admin-dashboard bg-[#1A1F2C] min-h-screen text-slate-200">
      {children}
    </div>
  );
};

export default SuperAdminTheme;
