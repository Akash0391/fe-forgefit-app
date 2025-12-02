"use client";

import React from "react";
import { useRouter } from "next/navigation";

import { ArrowLeft, ChevronRight, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export default function SelectPrimaryMuscle({ }) {

    const [searchQuery, setSearchQuery] = useState("");


    const menuItems = [
        { id: "arms", label: "Arms", icon: "/icons/arms.png", },
        { id: "back", label: "Back", icon: "/icons/back.png", },
        { id: "chest", label: "Chest", icon: "/icons/chest.png", },
        { id: "core", label: "Core", icon: "/icons/core.png", },
        { id: "cardio", label: "Cardio", icon: "/icons/cardio.png", },
        { id: "legs", label: "Legs", icon: "/icons/legs.png", },
        { id: "shoulders", label: "Shoulders", icon: "/icons/shoulder.png", },
        { id: "other", label: "Other", icon: "/icons/ellipsis.png", },
    ];
    return (
        <div className="bg-white text-gray-900">
            {/* Header */}
            <header className="sticky top-0 bg-white z-20 border-b border-gray-100">
                <div className="h-16 flex items-center px-4">
                    <button
                        aria-label="Back"
                        className="mr-2 rounded-full"
                        onClick={() => window.history.back()}
                    >
                        <ArrowLeft className="size-7 text-gray-700" />
                    </button>

                    <h1 className="flex-1 text-center text-lg font-regular">Select Muscle Group</h1>

                    <div className="w-7" />
                </div>
            </header>

            <div className="flex-shrink-0 p-4 space-y-4 bg-background">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 size-7 text-gray-400 pointer-events-none z-10" />
                    <Input
                        placeholder="Search muscle"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter"} // adding Handle search on Enter key later
                        className="w-full h-12 pl-14 pr-4 text-lg rounded-[8px] bg-gray-100 border-none outline-none placeholder:text-gray-400 transition-colors"
                    />
                </div>
            </div>
            <div className="px-1 mt-2 h-full">
                {menuItems.map((item) => {
                    const Icon = item.icon;

                    return (
                        <button
                            key={item.id}
                            onClick={() => { }}
                            className="w-full flex items-center gap-4 h-[80px] border-b border-gray-100 px-5 text-left hover:bg-gray-50 active:bg-gray-100 transition-colors"
                        >
                            <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-sm border border-gray-100 flex-shrink-0 overflow-hidden">
                                <img src={Icon} alt={item.label} className="w-12 h-12 object-contain" />
                            </div>

                            <span className="flex-1 text-lg text-gray-800">{item.label}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}