"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Menu, Calendar, Clock, ChevronRight, Dog, Activity } from "lucide-react";
import { useSystem } from "@/context/SystemContext";
import clsx from "clsx";

export default function Header({
    title,
    onToggleSidebar,
    sidebarCollapsed,
}: {
    title: string;
    onToggleSidebar?: () => void;
    sidebarCollapsed?: boolean;
}) {
    const router = useRouter();
    const { system, setSystem } = useSystem();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const formattedDate = isMounted ? currentTime.toLocaleDateString("en-US", {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    }) : "";

    const formattedTime = isMounted ? currentTime.toLocaleTimeString("en-US", {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    }) : "";

    return (
        <header className="flex justify-between items-center bg-white/80 backdrop-blur-md px-6 py-4 shadow-sm sticky top-0 z-30 border-b border-gray-100">
            <div className="flex items-center gap-4">
                {/* Mobile Toggle Button */}
                {onToggleSidebar && (
                    <button
                        onClick={onToggleSidebar}
                        className="lg:hidden flex items-center justify-center w-9 h-9 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all text-gray-600 border border-gray-100"
                        aria-label="Toggle sidebar"
                    >
                        <Menu className="h-5 w-5" />
                    </button>
                )}
                
                <div className="flex flex-col">
                    <div className="flex items-center gap-2 text-xs font-medium text-gray-400 uppercase tracking-wider">
                        <span>Pages</span>
                        <ChevronRight className="h-3 w-3" />
                        <span className="text-gray-600 uppercase font-bold">{title}</span>
                    </div>
                    <h1 className={clsx(
                        "text-3xl font-extrabold tracking-tight transition-colors duration-300",
                        system === "MDR" ? "text-[#0a3a7a]" : "text-[#356e67]"
                    )}>
                        {system === "MDR" ? title : "Dashboard"}
                    </h1>
                </div>
            </div>
            
            <div className="flex items-center gap-6">
                {/* System Switcher */}
                <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200 shadow-inner">
                    <button
                        onClick={() => setSystem("MDR")}
                        className={clsx(
                            "flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-300",
                            system === "MDR" 
                                ? "bg-white text-[#0a3a7a] shadow-sm" 
                                : "text-gray-500 hover:text-gray-700"
                        )}
                    >
                        <Activity className="h-4 w-4" />
                        MDR
                    </button>
                    <button
                        onClick={() => setSystem("MPR")}
                        className={clsx(
                            "flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-300",
                            system === "MPR" 
                                ? "bg-white text-green-600 shadow-sm" 
                                : "text-gray-500 hover:text-gray-700"
                        )}
                    >
                        <Dog className="h-4 w-4" />
                        MPR
                    </button>
                </div>

                {/* Real-time Date & Time */}
                <div className="hidden md:flex items-center gap-4 px-4 py-2 bg-gray-50/50 rounded-2xl border border-gray-100">
                    <div className="flex items-center gap-2 text-gray-600 border-r border-gray-200 pr-4">
                        <Calendar className={clsx(
                            "h-4 w-4 transition-colors duration-300",
                            system === "MDR" ? "text-[#0a3a7a]" : "text-green-600"
                        )} />
                        <span className="text-sm font-semibold">{formattedDate}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                        <Clock className={clsx(
                            "h-4 w-4 transition-colors duration-300",
                            system === "MDR" ? "text-[#0a3a7a]" : "text-green-600"
                        )} />
                        <span className="text-sm font-bold tabular-nums">{formattedTime}</span>
                    </div>
                </div>
            </div>
        </header>
    );
}
