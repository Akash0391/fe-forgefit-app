"use client";

import { useEffect, useState, useRef } from "react";
import { ArrowUpDown, RefreshCw, Plus, X, Minus, Trash } from "lucide-react";
import { Exercise } from "@/lib/api";

interface ExerciseOptionsModalProps {
    open: boolean;
    folderName: string;
    onClose: () => void;
    onReorder: () => void;
    onAddNewRoutine: () => void;
    onRename: () => void;
    onDeleteFolder: () => void;
}

export default function FolderOptionModal({
    open,
    folderName,
    onClose,
    onReorder,
    onAddNewRoutine,
    onRename,
    onDeleteFolder,

}: ExerciseOptionsModalProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [shouldRender, setShouldRender] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (open) {
            // Clear any existing timeout
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
            // Mount the component first
            setShouldRender(true);
            // Small delay to ensure DOM is ready before starting transition
            // This allows the closing state to be rendered first, then transition to open
            setTimeout(() => {
                setIsVisible(true);
            }, 10);
        } else {
            // Start closing transition immediately
            setIsVisible(false);
            // Delay unmounting to allow transition to complete
            timeoutRef.current = setTimeout(() => {
                setShouldRender(false);
            }, 300); // Match the transition duration
        }

        // Cleanup timeout on unmount
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [open]);

    if (!shouldRender) return null;

    const menuItems = [
        {
            icon: ArrowUpDown,
            label: "Reorder Folders",
            onClick: onReorder,
            textColor: "text-gray-900",
        },
        {
            icon: RefreshCw,
            label: "Rename Folder",
            onClick: onRename,
            textColor: "text-gray-900",
        },
        {
            icon: Plus,
            label: "Add New Routine",
            onClick: onAddNewRoutine,
            textColor: "text-gray-900",
        },
        {
            icon: Trash,
            label: "Delete Folder",
            onClick: onDeleteFolder,
            textColor: "text-red-500",
        },
    ];

    return (
        <>
            {/* Overlay */}
            <div
                className={`fixed inset-0 bg-black/50 z-50 transition-opacity duration-300 ease-in-out ${isVisible ? "opacity-100" : "opacity-0"
                    }`}
                onClick={onClose}
                style={{ pointerEvents: isVisible ? "auto" : "none" }}
            />
            {/* Modal Content - Bottom Sheet */}
            <div
                className={`fixed bottom-0 left-0 right-0 z-50 bg-gray-100 rounded-t-[30px] shadow-lg transition-all duration-300 ease-in-out min-h-[50vh] ${isVisible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
                    }`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Drag Handle */}
                <div className="flex justify-center pt-2">
                    <div className="h-1.5 w-17 bg-gray-400 rounded-lg"></div>
                </div>

                {/* ✅ Folder name under drag handle */}
                <div className="mt-6 text-center border-b border-gray-200 px-6 pb-5">
                    <p className="text-xl font-regular text-gray-500">
                        {folderName}
                    </p>
                </div>
                <div className="px-6 py-5 pb-8">
                    <div className="bg-white rounded-[10px] overflow-hidden">
                        {menuItems.map((item, index) => {
                            const Icon = item.icon;
                            const isLast = index === menuItems.length - 1;
                            return (
                                <button
                                    key={index}
                                    onClick={() => {
                                        item.onClick();
                                        // Only close if it's not "Add To Superset" - that modal will handle closing
                                        // "Remove From Superset" closes immediately
                                        if (item.label !== "Add To Superset") {
                                            onClose();
                                        }
                                    }}
                                    className={`w-full flex items-center gap-5 px-6 py-6 transition-colors text-left ${!isLast ? "border-b border-gray-100" : ""
                                        } hover:bg-gray-50 active:bg-gray-100`}
                                >
                                    <Icon className={`size-7 ${item.textColor} flex-shrink-0`} />
                                    <span className={`text-lg font-regular ${item.textColor}`}>
                                        {item.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </>
    );
}
