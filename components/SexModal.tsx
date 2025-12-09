"use client";

import { useEffect, useState, useRef } from "react";
import { Check } from "lucide-react";

interface ProfileMediaSelectionModalProps {
    open: boolean;
    onClose: () => void;
    onMale: () => void;
    onFemale: () => void;
    onOther: () => void;
    selectedSex: "male" | "female" | "other" | "" ;
}

export default function SexModal({
    open,
    onClose,
    onMale,
    onFemale,
    onOther,
    selectedSex,
}: ProfileMediaSelectionModalProps) {
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
            label: "Male",
            onClick: onMale,
            textColor: "text-black",
        },
        {
            label: "Female",
            onClick: onFemale,
            textColor: "text-black",
        },
        {
            label: "Other",
            onClick: onOther,
            textColor: "text-black",
        }
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
                className={`fixed bottom-0 left-0 right-0 z-50 bg-gray-100 rounded-t-[30px] shadow-lg transition-all duration-300 ease-in-out min-h-[40vh] ${isVisible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
                    }`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Drag Handle */}
                <div className="flex justify-center pt-2">
                    <div className="h-1.5 w-17 bg-gray-400 rounded-lg"></div>
                </div>

                <div className=" text-center border-b border-gray-200 -mx-6 px-6">
                    {/* Title */}
                    <h2 className="text-lg font-regular text-black my-6">Sex</h2>
                </div>

                <div className="px-6 py-5 pb-8">
                    <div className="bg-white rounded-[10px] overflow-hidden">
                        {menuItems.map((item, index) => {
                            const isLast = index === menuItems.length - 1;
                            const isSelected = selectedSex === item.label.toLowerCase();
                            return (
                                <button
                                    key={index}
                                    onClick={() => {
                                        item.onClick();
                                        // Only close if it's not "Cancel" - that modal will handle closing
                                        if (item.label !== "Cancel") {
                                            onClose();
                                        }
                                    }}
                                    className={`w-full flex items-center gap-5 px-6 py-6 transition-colors text-left ${!isLast ? "border-b border-gray-100" : ""
                                        } hover:bg-gray-50 active:bg-gray-100`}
                                >
                                    <span className={`text-lg font-regular ${item.textColor}`}>
                                        {item.label}
                                    </span>

                                    {/* ✅ CHECKMARK ON RIGHT */}
                                    {isSelected && (
                                        <Check className="ml-auto size-6 text-blue-500" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </>
    );
}

