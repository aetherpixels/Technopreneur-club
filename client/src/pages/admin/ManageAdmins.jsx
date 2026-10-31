import React from 'react';
import UserManagementTable from '../../components/UserManagementTable';

const ManageAdmins = () => {
  return (
    <div className="animate-fadeIn">
      <UserManagementTable role="Admin" />
    </div>
  );
};

export default ManageAdmins;
