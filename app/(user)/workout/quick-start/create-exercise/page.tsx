"use client";

import React from "react";
import { ArrowLeft, Camera, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";


export default function CreateExercisePage() {
    const router = useRouter();
    const [createExerciseTitle, setCreateExerciseTitle] = React.useState("");
    return (
        <div className="min-h-screen bg-white text-gray-900">
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

                    <h1 className="flex-1 text-center text-lg font-regular">Create Exercise</h1>

                    <button
                        aria-label="Save"
                        className=" px-4 py-2 bg-blue-500 text-white text-lg rounded-[8px]"
                        onClick={() => alert("Save clicked — wire up your save logic")}
                    >
                        Save
                    </button>
                </div>
            </header>

            <main className="px-6">
                {/* Asset upload circle */}
                <div className="w-full flex flex-col gap-2 items-center justify-center mt-12">
                    <div className="w-36 h-36 rounded-full border border-gray-200 flex items-center justify-center">
                        <button
                            aria-label="Add asset"
                            className="flex flex-col items-center justify-center"
                            onClick={() => alert('Open asset picker')}
                        >
                            <div className="w-12 h-12 flex items-center justify-center">
                                <Camera className="size-8 text-black" />
                            </div>

                        </button>
                    </div>
                    <span className="text-lg text-blue-500 mt-3">Add Asset</span>
                </div>

                {/* Exercise Name input (simple underline style) */}
                <div className="mt-8 border-b border-gray-100 pb-5">
                    <Input
                        type="text"
                        placeholder="Exercise Name"
                        value={createExerciseTitle}
                        onChange={(e) => setCreateExerciseTitle(e.target.value)}
                        className="text-xl font-bold border-none bg-transparent p-1 placeholder:text-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                </div>
            </main>

            <div className="py-2 px-4">
                <div className="mb-2">
                    <button
                        onClick={() => {
                            router.push("/workout/quick-start/timer-settings/sounds/select-timer-sound");
                        }}
                        className="w-full flex justify-between py-3 hover:bg-gray-50 border-b border-gray-100 transition-colors"
                    >
                        <div className="flex-1 flex items-start flex-col gap-2">
                            <span className="text-lg font-regular text-black">Equipment</span>
                            <span className="text-lg text-blue-500">Select</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <ChevronRight className="size-7 text-gray-400" />
                        </div>
                    </button>
                </div>

                <div className="mb-2">
                    <button
                        onClick={() => {
                            router.push("/workout/quick-start/timer-settings/sounds/select-timer-sound");
                        }}
                        className="w-full flex justify-between py-3 hover:bg-gray-50 border-b border-gray-100 transition-colors"
                    >
                        <div className="flex-1 flex items-start flex-col gap-2">
                            <span className="text-lg font-regular text-black">Primary Muscle Group</span>
                            <span className="text-lg text-blue-500">Select</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <ChevronRight className="size-7 text-gray-400" />
                        </div>
                    </button>
                </div>

                <div className="mb-2">
                    <button
                        onClick={() => {
                            router.push("/workout/quick-start/timer-settings/sounds/select-timer-sound");
                        }}
                        className="w-full flex justify-between py-3 hover:bg-gray-50 border-b border-gray-100 transition-colors"
                    >
                        <div className="flex-1 flex items-start flex-col gap-2">
                            <span className="text-lg font-regular text-black">Other Muscles</span>
                            <span className="text-lg text-blue-500">
                                Select{" "}
                                <span className="text-lg text-gray-400">
                                    (optional)
                                </span>
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <ChevronRight className="size-7 text-gray-400" />
                        </div>
                    </button>
                </div>

                <div className="mb-2">
                    <button
                        onClick={() => {
                            router.push("/workout/quick-start/timer-settings/sounds/select-timer-sound");
                        }}
                        className="w-full flex justify-between py-3 hover:bg-gray-50  transition-colors"
                    >
                        <div className="flex-1 flex items-start flex-col gap-2">
                            <span className="text-lg font-regular text-black">Exercise Type</span>
                            <span className="text-lg text-blue-500">Select</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <ChevronRight className="size-7 text-gray-400" />
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
}
