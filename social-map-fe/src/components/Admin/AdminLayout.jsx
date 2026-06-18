import React from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';

export default function AdminLayout() {
  return (
    <div data-admin-layout className="w-full min-h-screen bg-[#F4EEE3] p-4" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="max-w-[1600px] mx-auto bg-white/50 rounded-3xl border border-gray-200 p-4 backdrop-blur-sm">
        <div className="flex gap-4 min-h-[calc(100vh-2rem)] lg:h-[calc(100vh-2rem)]">
          <div className="hidden lg:block flex-shrink-0">
            <AdminSidebar />
          </div>

          <main className="flex-1 flex flex-col overflow-hidden min-w-0">
            <div className="flex-1 overflow-y-auto pr-1">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
