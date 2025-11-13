"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Menu, Calendar, Download } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

    return (
        <header className="flex justify-between items-center bg-white px-6 py-4 shadow-sm sticky top-0 z-30 border-b">
            <div className="flex items-center gap-4">
                {/* Mobile Toggle Button */}
                {onToggleSidebar && (
                    <button
                        onClick={onToggleSidebar}
                        className="lg:hidden flex items-center justify-center w-8 h-8 rounded-md hover:bg-gray-100 transition-colors"
                        aria-label="Toggle sidebar"
                    >
                        <Menu className="h-5 w-5 text-gray-800" />
                    </button>
                )}
                
                <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            </div>
            
            <div className="flex items-center gap-4">
                {/* Date Range Picker */}
                <div className="hidden md:flex items-center gap-2 px-3 py-2 border rounded-lg text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>Jan 20, 2023 - Feb 09, 2023</span>
                </div>

                {/* Download Button */}
                <Button
                    className="bg-[#0a3a7a] hover:bg-[#09406d] text-white"
                >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                </Button>
            </div>
        </header>
    );
}
