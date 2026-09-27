import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHome from './faculty/DashboardHome';
import Students from './faculty/Students';
import Sessions from './faculty/Sessions';
import Attendance from './faculty/Attendance';
import Reports from './faculty/Reports';

const FacultyDashboard = () => {
  return (
    <DashboardLayout>
      <Routes>
        <Route path="/" element={<DashboardHome />} />
        <Route path="/students" element={<Students />} />
        <Route path="/sessions" element={<Sessions />} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="*" element={<Navigate to="/faculty" replace />} />
      </Routes>
    </DashboardLayout>
  );
};

export default FacultyDashboard;
