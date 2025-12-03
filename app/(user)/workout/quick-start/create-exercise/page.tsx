"use client";

import React, { useEffect, useState } from "react";
import { ArrowLeft, Camera, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useRouter, useSearchParams } from "next/navigation";
import MediaAssetModal from "@/components/MediaAssetModal";

export default function CreateExercisePage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [createExerciseTitle, setCreateExerciseTitle] = useState("");
    const [showMediaModal, setShowMediaModal] = useState(false);
    const [selectedEquipment, setSelectedEquipment] = useState<string | null>(null);
    const [selectedPrimaryMuscle, setSelectedPrimaryMuscle] = useState<string | null>(null);
    const [selectedOtherMuscles, setSelectedOtherMuscles] = useState<string | null>(null);
    const [selectedExerciseType, setSelectedExerciseType] = useState<string | null>(null);

    // Get selected equipment from query params when we come back
    useEffect(() => {
        const equipment = searchParams.get("equipment");
        const primaryMuscle = searchParams.get("primaryMuscle");
        const otherMuscles = searchParams.get("otherMuscles");
        const exerciseType = searchParams.get("exerciseType");

        if (equipment) setSelectedEquipment(equipment);
        if (primaryMuscle) setSelectedPrimaryMuscle(primaryMuscle);
        if (otherMuscles) setSelectedOtherMuscles(otherMuscles);
        if (exerciseType) setSelectedExerciseType(exerciseType);
    }, [searchParams]);

    const handleTakePhoto = () => {
        setShowMediaModal(false);
        alert("Take Photo clicked — wire up your camera logic");
    };

    const handleSelectFromLibrary = () => {
        setShowMediaModal(false);
        alert("Select From Library clicked — wire up your library logic");
    };

    const withCurrentParams = (basePath: string) => {
        const current = searchParams.toString();
        return current ? `${basePath}?${current}` : basePath;
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
                            router.push("/workout/quick-start/add-exercise") // <- your Add Exercise route
                        }
                    >
                        <ArrowLeft className="size-7 text-gray-700" />
                    </button>

                    <h1 className="flex-1 text-center text-lg font-regular">
                        Create Exercise
                    </h1>

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
                            onClick={() => setShowMediaModal(true)}
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
                {/* Equipment row */}
                <div className="mb-2">
                    <button
                        onClick={() => {
                            router.push(
                                withCurrentParams(
                                    "/workout/quick-start/create-exercise/select-equipment"
                                )
                            );
                        }}
                        className="w-full flex justify-between py-3 hover:bg-gray-50 border-b border-gray-100 transition-colors"
                    >
                        <div className="flex-1 flex items-start flex-col gap-2">
                            <span className="text-lg font-regular text-black">
                                Equipment
                            </span>
                            {selectedEquipment ? (
                                <span className="text-lg text-gray-500">
                                    {selectedEquipment}
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

                {/* Primary muscle group */}
                <div className="mb-2">
                    <button
                        onClick={() => {
                            router.push(
                                withCurrentParams(
                                    "/workout/quick-start/create-exercise/select-primary-muscle"
                                ));
                        }}
                        className="w-full flex justify-between py-3 hover:bg-gray-50 border-b border-gray-100 transition-colors"
                    >
                        <div className="flex-1 flex items-start flex-col gap-2">
                            <span className="text-lg font-regular text-black">
                                Primary Muscle Group
                            </span>
                            {selectedPrimaryMuscle ? (
                                <span className="text-lg text-gray-500">
                                    {selectedPrimaryMuscle}
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
                        onClick={() => {
                            router.push(
                                withCurrentParams(
                                    "/workout/quick-start/create-exercise/select-other-muscles"
                                ));
                        }}
                        className="w-full flex justify-between py-3 hover:bg-gray-50 border-b border-gray-100 transition-colors"
                    >
                        <div className="flex-1 flex items-start flex-col gap-2">
                            <span className="text-lg font-regular text-black">
                                Other Muscles
                            </span>
                            {selectedOtherMuscles ? (
                                selectedOtherMuscles
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
                        onClick={() => {
                            router.push(
                                withCurrentParams(
                                    "/workout/quick-start/create-exercise/select-exercise-type"
                                ));
                        }}
                        className="w-full flex justify-between py-3 hover:bg-gray-50  transition-colors"
                    >
                        <div className="flex-1 flex items-start flex-col gap-2">
                            <span className="text-lg font-regular text-black">
                                Exercise Type
                            </span>
                            {selectedExerciseType ? (
                                <span className="text-lg text-gray-500">
                                    {selectedExerciseType}
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

            {/* Media Selection Modal */}
            <MediaAssetModal
                open={showMediaModal}
                onClose={() => setShowMediaModal(false)}
                onTakePhoto={handleTakePhoto}
                onSelectFromLibrary={handleSelectFromLibrary}
            />
        </div>
    );
}
