"use client";

import React, { useState } from "react";
import { ArrowLeft, Camera, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import MediaAssetModal from "@/components/MediaAssetModal";
import { useCreateExerciseStore } from "@/store/useCreateExerciseStore";

const API_BASE =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default function CreateExercisePage() {
    const router = useRouter();

    // UI-only modal state can stay local
    const [showMediaModal, setShowMediaModal] = useState(false);

    // 👉 pull everything from Zustand
    const {
        title,
        equipment,
        primaryMuscle,
        otherMuscles,
        exerciseType,
        isSaving,
        setTitle,
        setIsSaving,
        reset,
    } = useCreateExerciseStore();

    const handleTakePhoto = () => {
        setShowMediaModal(false);
        alert("Take Photo clicked — wire up your camera logic");
    };

    const handleSelectFromLibrary = () => {
        setShowMediaModal(false);
        alert("Select From Library clicked — wire up your library logic");
    };

    const handleSave = async () => {
        if (!title.trim()) {
            alert("Please enter an exercise name");
            return;
        }

        setIsSaving(true);
        try {
            const body = {
                name: title.trim(),
                equipment: equipment || undefined,
                primaryMuscle: primaryMuscle || undefined,
                otherMuscles: otherMuscles
                    ? otherMuscles.split(",").map((s) => s.trim())
                    : [],
                description: "",
                difficulty: "beginner",
            };

            const res = await fetch(`${API_BASE}/api/exercises`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(body),
            });

            const json = await res.json();
            if (!res.ok || !json.success) {
                console.error("Create exercise error:", json);
                throw new Error(json.message || "Failed to create exercise");
            }

            // clear draft
            reset();
            window.dispatchEvent(new Event("customExerciseUpdated"));

            router.push("/workout/quick-start/add-exercise?section=custom");
        } catch (err) {
            console.error(err);
            alert("Failed to save exercise. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-white text-gray-900">
            {/* Header */}
            <header className="sticky top-0 bg-white z-20 border-b border-gray-100">
                <div className="h-16 flex items-center px-4">
                    <button
                        aria-label="Back"
                        className="mr-2 rounded-full"
                        onClick={() =>
                            router.push("/workout/quick-start/add-exercise")
                        }
                    >
                        <ArrowLeft className="size-7 text-gray-700" />
                    </button>

                    <h1 className="flex-1 text-center text-lg font-regular">
                        Create Exercise
                    </h1>

                    <button
                        aria-label="Save"
                        className="px-4 py-2 bg-blue-500 text-white text-lg rounded-[8px] disabled:opacity-60"
                        onClick={handleSave}
                        disabled={isSaving}
                    >
                        {isSaving ? "Saving..." : "Save"}
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
                            onClick={() => setShowMediaModal(true)}
                        >
                            <div className="w-12 h-12 flex items-center justify-center">
                                <Camera className="size-8 text-black" />
                            </div>
                        </button>
                    </div>
                    <span className="text-lg text-blue-500 mt-3">Add Asset</span>
                </div>

                {/* Exercise Name input */}
                <div className="mt-8 border-b border-gray-100 pb-5">
                    <Input
                        type="text"
                        placeholder="Exercise Name"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}  // 👈 Zustand
                        className="text-xl font-bold border-none bg-transparent p-1 placeholder:text-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                </div>
            </main>

            <div className="py-2 px-4">
                {/* Equipment */}
                <div className="mb-2">
                    <button
                        onClick={() =>
                            router.push(
                                "/workout/quick-start/create-exercise/select-equipment"
                            )
                        }
                        className="w-full flex justify-between py-3 hover:bg-gray-50 border-b border-gray-100 transition-colors"
                    >
                        <div className="flex-1 flex items-start flex-col gap-2">
                            <span className="text-lg font-regular text-black">
                                Equipment
                            </span>
                            {equipment ? (
                                <span className="text-lg text-gray-500">{equipment}</span>
                            ) : (
                                <span className="text-lg text-blue-500">Select</span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <ChevronRight className="size-7 text-gray-400" />
                        </div>
                    </button>
                </div>

                {/* Primary muscle group */}
                <div className="mb-2">
                    <button
                        onClick={() =>
                            router.push(
                                "/workout/quick-start/create-exercise/select-primary-muscle"
                            )
                        }
                        className="w-full flex justify-between py-3 hover:bg-gray-50 border-b border-gray-100 transition-colors"
                    >
                        <div className="flex-1 flex items-start flex-col gap-2">
                            <span className="text-lg font-regular text-black">
                                Primary Muscle Group
                            </span>
                            {primaryMuscle ? (
                                <span className="text-lg text-gray-500">
                                    {primaryMuscle}
                                </span>
                            ) : (
                                <span className="text-lg text-blue-500">Select</span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <ChevronRight className="size-7 text-gray-400" />
                        </div>
                    </button>
                </div>

                {/* Other muscles */}
                <div className="mb-2">
                    <button
                        onClick={() =>
                            router.push(
                                "/workout/quick-start/create-exercise/select-other-muscles"
                            )
                        }
                        className="w-full flex justify-between py-3 hover:bg-gray-50 border-b border-gray-100 transition-colors"
                    >
                        <div className="flex-1 flex items-start flex-col gap-2">
                            <span className="text-lg font-regular text-black">
                                Other Muscles
                            </span>
                            {otherMuscles ? (
                                <span className="text-lg text-gray-500">
                                    {otherMuscles}
                                </span>
                            ) : (
                                <span className="text-lg text-blue-500">
                                    Select{" "}
                                    <span className="text-lg text-gray-400">(optional)</span>
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <ChevronRight className="size-7 text-gray-400" />
                        </div>
                    </button>
                </div>

                {/* Exercise type */}
                <div className="mb-2">
                    <button
                        onClick={() =>
                            router.push(
                                "/workout/quick-start/create-exercise/select-exercise-type"
                            )
                        }
                        className="w-full flex justify-between py-3 hover:bg-gray-50 transition-colors"
                    >
                        <div className="flex-1 flex items-start flex-col gap-2">
                            <span className="text-lg font-regular text-black">
                                Exercise Type
                            </span>
                            {exerciseType ? (
                                <span className="text-lg text-gray-500">
                                    {exerciseType}
                                </span>
                            ) : (
                                <span className="text-lg text-blue-500">Select</span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <ChevronRight className="size-7 text-gray-400" />
                        </div>
                    </button>
                </div>
            </div>

            <MediaAssetModal
                open={showMediaModal}
                onClose={() => setShowMediaModal(false)}
                onTakePhoto={handleTakePhoto}
                onSelectFromLibrary={handleSelectFromLibrary}
            />
        </div>
    );
}
