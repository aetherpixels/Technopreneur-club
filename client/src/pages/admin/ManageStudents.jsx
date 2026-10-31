import React from 'react';
import UserManagementTable from '../../components/UserManagementTable';

const ManageStudents = () => {
  return (
    <div className="animate-fadeIn">
      <UserManagementTable role="Student" />
    </div>
  );
};

export default ManageStudents;
