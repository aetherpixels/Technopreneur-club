// idGenerator.js

const getDeptCode = (departmentString) => {
  if (!departmentString) return 'GEN';
  
  const map = {
    'COMPUTER ENGINEERING DEPARTMENT': 'CE',
    'INFORMATION TECHNOLOGY DEPARTMENT': 'IT',
    'CIVIL DEPARTMENT': 'CV',
    'MECHANICAL DEPARTMENT': 'ME',
    'AUTOMOBILE DEPARTMENT': 'AE',
    'EC DEPARTMENT': 'EC',
    'ELECTRICAL DEPARTMENT': 'EE'
  };

  return map[departmentString] || 'GEN';
};

export const generateStudentId = (department) => {
  const year = new Date().getFullYear();
  const code = getDeptCode(department);
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `${year}${code}${rand}`;
};

export const generateFacultyId = (department) => {
  const code = getDeptCode(department);
  const rand = Math.floor(100 + Math.random() * 900);
  return `FAC${code}${rand}`;
};

export const generateAdminId = (department) => {
  const code = getDeptCode(department);
  const rand = Math.floor(10 + Math.random() * 90);
  return `ADM${code}${rand}`;
};
