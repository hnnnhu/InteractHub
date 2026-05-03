// src/components/layout/MainLayout.tsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const MainLayout: React.FC = () => {
    return (
        <div className="min-h-screen bg-[#111113] text-white font-sans selection:bg-[#FF1493]/30 selection:text-white flex">
            {/* Sidebar cố định bên trái */}
            <Sidebar />

            {/* Khu vực chính bên phải: Topbar + Nội dung */}
            <div className="flex-1 flex flex-col min-w-0">
                <Topbar />

                <main className="flex-1 pt-[76px] lg:ml-60 p-4 sm:p-6 lg:p-8 min-h-screen relative overflow-x-hidden">
                    {/* Ánh sáng nền tinh tế */}
                    <div className="absolute top-[10%] left-[20%] w-[300px] h-[300px] bg-[#FF1493]/5 rounded-full blur-[150px] pointer-events-none z-0" />
                    <div className="absolute bottom-[20%] right-[10%] w-[400px] h-[400px] bg-[#4F6BFF]/5 rounded-full blur-[150px] pointer-events-none z-0" />

                    <div className="relative z-10 w-full">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default MainLayout;