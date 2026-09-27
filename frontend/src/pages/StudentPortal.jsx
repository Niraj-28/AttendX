import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import StudentHome from './student/StudentHome';
import Attendance from './student/Attendance';

const StudentPortal = () => {
  return (
    <DashboardLayout>
      <Routes>
        <Route path="/" element={<StudentHome />} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="*" element={<Navigate to="/student" replace />} />
      </Routes>
    </DashboardLayout>
  );
};

export default StudentPortal;
