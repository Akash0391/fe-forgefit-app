"use client";

import { RotateCw, Plus, Notebook, Search, Play, X, ChevronDown, ChevronRight, MoreHorizontal, FolderPlus, MoreVertical, MoreHorizontalIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { workoutApi, Workout, Exercise, RoutineFolder } from "@/lib/api";
import DiscardWorkoutModal from "@/components/DiscardWorkoutModal";
import RoutineOptionsModal from "@/components/RoutineOptionsModal";
import DeleteRoutineModal from "@/components/DeleteRoutineModal";
import { FolderModal } from "@/components/FolderModal";
import FolderOptionModal from "@/components/FolderOptionModal";
import { RenameFolderModal } from "@/components/RenameFolderModal";
import { socket } from "@/lib/socket";
import { useAuth } from "@/contexts/AuthContext";

export default function WorkoutPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [workoutInProgress, setWorkoutInProgress] = useState(false);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [routines, setRoutines] = useState<Workout[]>([]);
  const [loadingRoutines, setLoadingRoutines] = useState(true);
  const [showRoutines, setShowRoutines] = useState(true);
  const [selectedRoutine, setSelectedRoutine] = useState<Workout | null>(null);
  const [showRoutineModal, setShowRoutineModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [folders, setFolders] = useState<RoutineFolder[]>([]);
  const [loadingFolders, setLoadingFolders] = useState(true);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});

  const [showFolderOptionModal, setShowFolderOptionModal] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<RoutineFolder | null>(null);

  const [showRenameFolderModal, setShowRenameFolderModal] = useState(false); // For future use



  useEffect(() => {
    // Check if workout is in progress
    const inProgress = localStorage.getItem("workoutInProgress") === "true";
    setWorkoutInProgress(inProgress);

    // Fetch routines
    fetchRoutines();
    fetchFolders();

    // Refresh routines when page becomes visible (e.g., navigating back from another page)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchRoutines();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    const checkActiveWorkout = async () => {
      try {
        const res = await workoutApi.getActive();

        if (res.data) {
          sessionStorage.setItem("draftWorkoutId", res.data._id);
          localStorage.setItem("workoutInProgress", "true");
          setWorkoutInProgress(true);
        }
      } catch (err) {
        console.error("Error checking active workout:", err);
      }
    };

    checkActiveWorkout();
  }, []);


  const fetchRoutines = async () => {
    try {
      setLoadingRoutines(true);
      const response = await workoutApi.getRoutines();
      setRoutines(response.data || []);
    } catch (error) {
      console.error("Error fetching routines:", error);
    } finally {
      setLoadingRoutines(false);
    }
  };

  const fetchFolders = async () => {
    try {
      setLoadingFolders(true);
      const res = await workoutApi.getRoutineFolders();
      setFolders(res.data || []);
    } catch (err) {
      console.error("Error fetching routine folders:", err);
    } finally {
      setLoadingFolders(false);
    }
  };


  const handleRefresh = () => {
    fetchRoutines();
    window.location.reload();
  };

  const handleStartEmptyWorkout = () => {
    // Set workout in progress flag
    localStorage.setItem("workoutInProgress", "true");
    router.push("/workout/quick-start");
  };

  const handleResumeWorkout = () => {
    router.push("/workout/quick-start");
  };

  const handleDiscardClick = () => {
    setShowDiscardDialog(true);
  };

  const handleDiscardConfirm = () => {
    setWorkoutInProgress(false);
  };

  const handleExploreRoutines = () => {
    router.push("/workout/explore-routine");
  }

  const handleStartRoutine = async (routine: Workout) => {
    try {
      const workoutData = {
        routineId: routine._id,
        exercises: routine.exercises,
        supersetGroups: routine.supersetGroups || []
      };

      // 🔥 call backend to create draft workout
      const res = await workoutApi.startWorkout(workoutData);
      const draftWorkout = res.data;

      // store for resume
      sessionStorage.setItem("draftWorkoutId", draftWorkout._id);
      localStorage.setItem("workoutInProgress", "true");

      // 🔥 join websocket room
      socket.emit("joinWorkout", {
        userId: user?._id,
        draftWorkoutId: draftWorkout._id
      });

      router.push("/workout/quick-start");
    } catch (err) {
      console.error("Failed to start workout", err);
    }
  };




  // Format exercise name with equipment in parentheses if available
  const formatExerciseName = (exercise: Exercise) => {
    const name = exercise.name;
    const equipment = exercise.equipment;

    // If equipment is not "bodyweight" and not already in the name, add it
    if (equipment && equipment !== "bodyweight" && equipment !== "other") {
      const equipmentFormatted =
        equipment.charAt(0).toUpperCase() + equipment.slice(1);
      if (!name.toLowerCase().includes(equipment.toLowerCase())) {
        return `${name} (${equipmentFormatted})`;
      }
    }
    return name;
  };

  const handleRoutineOptionsClick = (routine: Workout) => {
    setSelectedRoutine(routine);
    setShowRoutineModal(true);
  };

  const handleRoutineModalClose = () => {
    setShowRoutineModal(false);
    setSelectedRoutine(null);
  };

  const handleRoutineEdit = () => {
    if (!selectedRoutine) return;

    // Close modal and navigate to edit routine page
    handleRoutineModalClose();
    router.push(`/workout/edit-routine?id=${selectedRoutine._id}`);
  };

  const handleRoutineDelete = () => {
    // Show delete confirmation modal
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedRoutine) return;

    try {
      await workoutApi.delete(selectedRoutine._id);

      // Refresh routines list
      await fetchRoutines();

      // Close modals
      setShowDeleteConfirm(false);
      handleRoutineModalClose();
    } catch (error) {
      console.error("Error deleting routine:", error);
      // Still close modals even if there's an error
      setShowDeleteConfirm(false);
      handleRoutineModalClose();
    }
  };

  const handleRoutineShare = () => {
    // TODO: Implement share routine
    console.log("Share routine:", selectedRoutine?._id);
  };

  const handleRoutineDuplicate = () => {
    if (!selectedRoutine) return;

    const routineData = {
      name: `${selectedRoutine.name} (copy)`,
      // preserve folder if you want the copy to stay in same folder
      routineFolderId: selectedRoutine.routineFolderId ?? null,

      exercises: selectedRoutine.exercises.map((ex) => {
        const baseExercise =
          typeof ex.exerciseId === "object"
            ? ex.exerciseId
            : { _id: ex.exerciseId };

        return {
          exercise: {
            ...baseExercise,
            // ⬇ carry timer from routine into builder
            restTimerSeconds: (ex as any).restTimerSeconds ?? 0,
          },
          sets: ex.sets || [],
          notes: ex.notes || "",
        };
      }),

      // ⬇ carry supersets into builder
      supersetGroups: selectedRoutine.supersetGroups || [],
    };

    sessionStorage.setItem("workoutToRoutine", JSON.stringify(routineData));
    handleRoutineModalClose();
    router.push("/workout/new-routine");
  };


  const handleDeleteFolder = async () => {
    if (!selectedFolder) return;

    try {
      await workoutApi.deleteRoutineFolder(selectedFolder._id);
      setFolders((prev) => prev.filter((f) => f._id !== selectedFolder._id));
      setSelectedFolder(null);
    } catch (err) {
      console.error("Error deleting folder:", err);
    }
  };

  const handleRenameFolder = () => {
    setShowRenameFolderModal(true)
  };

  const handleRenameFolderSave = async (newName: string) => {
    if (!selectedFolder) return;

    try {
      const res = await workoutApi.renameRoutineFolder(selectedFolder._id, newName);

      const updated = res.data;

      // update folders list in UI
      setFolders((prev) =>
        prev.map((f) => (f._id === updated._id ? updated : f))
      );

      // keep selectedFolder in sync
      setSelectedFolder(updated);

      setShowRenameFolderModal(false);
    } catch (err) {
      console.error("Error renaming folder:", err);
      // optional: show toast
    }
  };

  // Routines that are NOT in any folder → show in "My Routines"
  const myRoutines = routines.filter((r) => !r.routineFolderId);

  // Helper to get routines inside a folder
  const getFolderRoutines = (folderId: string) =>
    routines.filter((r) => r.routineFolderId === folderId);



  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background">
        <div className="flex items-center justify-between h-16 px-4">

          {/* Middle: Workout Title */}
          <h1 className="text-xl font-semibold">Workout</h1>

          {/* Right: Refresh Icon */}
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              className="h-10 w-10"
              aria-label="Refresh page"
            >
              <RotateCw className="size-[20px]" />
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="p-4 space-y-4 pb-20">
        {/* Quick Start Section */}
        <section>
          <h2 className="text-xm font-semibold mb-5">Quick Start</h2>
          <Button
            onClick={() => {
              handleStartEmptyWorkout();
            }}
            variant="outline"
            className="w-full justify-start text-xm bg-gray-100 rounded-[10px] p-6"
            size="lg"
          >
            <Plus className="size-[18px]" />{" "}
            <span className="font-regular">Start Empty Workout</span>
          </Button>
        </section>

        {/* Routines Section */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xm font-semibold">Routines</h2>
            {/* ✅ Show folder icon ONLY if at least one routine exists */}
            {!loadingRoutines && routines.length > 0 && (
              <button
                onClick={() => setShowCreateFolderModal(true)}
                className="flex items-center justify-center rounded-[10px] p-2 transition-colors cursor-pointer"
                aria-label="New Routine"
              >
                <FolderPlus className="size-[22px]" />
              </button>
            )}
          </div>
          <div className="flex flex-row gap-2">
            <button
              onClick={() => {
                router.push("/workout/new-routine");
              }}
              className="w-1/2 flex flex-col items-center justify-center bg-gray-100 rounded-[10px] p-6 hover:bg-gray-200 transition-colors cursor-pointer active:scale-95"
            >
              <Notebook className="size-[20px] mb-2" />
              <p className="text-xm font-regular">New Routine</p>
            </button>
            <button
              onClick={() => {
                handleExploreRoutines();
              }}
              className="w-1/2 flex flex-col items-center justify-center bg-gray-100 rounded-[10px] p-6 hover:bg-gray-200 transition-colors cursor-pointer active:scale-95"
            >
              <Search className="size-[20px] mb-2" />
              <p className="text-xm font-regular">Explore routines</p>
            </button>
          </div>
        </section>

        {/* Folders Section – from backend, above My Routines */}
        {!loadingFolders &&
          folders.map((folder) => {
            const expanded = expandedFolders[folder._id] ?? true;
            const folderRoutines = getFolderRoutines(folder._id);

            return (
              <section key={folder._id} className="mt-4">
                {/* Folder header (e.g., "Gym") */}
                <button
                  onClick={() =>
                    setExpandedFolders((prev) => ({
                      ...prev,
                      [folder._id]: !expanded,
                    }))
                  }
                  className="flex items-center justify-between w-full mb-2"
                >
                  <div className="flex items-center gap-1">
                    {expanded ? (
                      <ChevronDown className="size-4 text-gray-400" />
                    ) : (
                      <ChevronRight className="size-4 text-gray-400" />
                    )}
                    <span className="text-sm font-semibold text-gray-500">
                      {folder.name}
                    </span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFolder(folder);
                      setShowFolderOptionModal(true);
                      // later: folder options (rename/delete)
                    }}
                    className="p-1 rounded-full hover:bg-gray-100"
                  >
                    <MoreHorizontal className="size-6 text-gray-900" />
                  </button>
                </button>

                {/* Folder content */}
                {expanded && (
                  <div className="space-y-4 mt-2">
                    {/* Folder routines */}
                    {getFolderRoutines(folder._id).map((routine) => {
                      const firstExercise = routine.exercises[0];
                      const exercise =
                        typeof firstExercise?.exerciseId === "object"
                          ? firstExercise.exerciseId
                          : null;

                      const handleCardClick = () => {
                        router.push(`/workout/routine?id=${routine._id}`);
                      };

                      return (
                        <div
                          key={routine._id}
                          className="bg-white rounded-[10px] p-4 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
                          onClick={handleCardClick}
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h3 className="text-sm font-semibold">{routine.name}</h3>
                              {exercise && (
                                <p className="text-sm text-gray-500">
                                  {formatExerciseName(exercise)}
                                </p>
                              )}
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRoutineOptionsClick(routine);
                              }}
                              className="flex-shrink-0 hover:bg-gray-100 rounded-full transition-colors p-1"
                              aria-label="Routine options"
                            >
                              <MoreHorizontal className="size-6 text-black" />
                            </button>
                          </div>
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartRoutine(routine);
                            }}
                            className="w-full bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-[10px] py-6"
                          >
                            Start Routine
                          </Button>
                        </div>
                      );
                    })}

                    {/* ⬇️ Only show dashed Add button if folder is empty */}
                    {folderRoutines.length === 0 && (
                      <div className="border border-dashed border-gray-300 rounded-[10px] p-4 flex items-center justify-center">
                        <button
                          onClick={() =>
                            router.push(`/workout/new-routine?folderId=${folder._id}`)
                          }
                          className="flex items-center gap-2 text-blue-500 text-xm font-regular hover:text-blue-600"
                        >
                          <Plus className="size-4" />
                          <span>Add new routine</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

              </section>
            );
          })}


        {/* My Routines Section – only show when there is at least 1 routine */}
        {!loadingRoutines && myRoutines.length > 0 && (
          <section>
            <button
              onClick={() => setShowRoutines(!showRoutines)}
              className="flex items-center gap-1 mb-5 w-full text-left"
            >
              {showRoutines ? (
                <ChevronDown className="size-4 text-gray-400" />
              ) : (
                <ChevronRight className="size-4 text-gray-400" />
              )}
              <h2 className="text-sm text-gray-400 font-semibold">
                My Routines ({myRoutines.length})
              </h2>
            </button>

            {showRoutines && (
              <div className="space-y-4">
                {myRoutines.map((routine) => {
                  const firstExercise = routine.exercises[0];
                  const exercise =
                    typeof firstExercise?.exerciseId === "object"
                      ? firstExercise.exerciseId
                      : null;

                  const handleCardClick = () => {
                    router.push(`/workout/routine?id=${routine._id}`);
                  };

                  return (
                    <div
                      key={routine._id}
                      className="bg-white rounded-[10px] p-4 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
                      onClick={handleCardClick}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-sm font-semibold">
                            {routine.name}
                          </h3>
                          {exercise && (
                            <p className="text-sm text-gray-500">
                              {formatExerciseName(exercise)}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRoutineOptionsClick(routine);
                          }}
                          className="flex-shrink-0 hover:bg-gray-100 rounded-full transition-colors p-1"
                          aria-label="Routine options"
                        >
                          <MoreHorizontal className="size-6 text-black" />
                        </button>
                      </div>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartRoutine(routine);
                        }}
                        className="w-full bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-[10px] p-4"
                      >
                        Start Routine
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}


        {/* Workout on Progress */}
        {workoutInProgress && (
          <div className="fixed bottom-18 left-0 right-0 px-4 md:hidden bg-white border-t border-gray-100 pt-3">
            <div className="w-full">
              <p className="text-sm font-regular text-muted-foreground text-center">Workout in Progress</p>
              <div className="flex gap-3">
                <Button
                  variant="default"
                  className="flex-1 text-sm bg-white hover:bg-blue-600 text-blue-500 rounded-[10px]"
                  onClick={handleResumeWorkout}
                >
                  <Play className="size-4" />
                  Resume
                </Button>
                <Button
                  variant="default"
                  className="flex-1 text-sm bg-white text-red-500 hover:bg-gray-200 rounded-[10px]"
                  onClick={handleDiscardClick}
                >
                  <X className="size-4" />
                  Discard
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Discard Workout Modal */}
      <DiscardWorkoutModal
        open={showDiscardDialog}
        onClose={() => setShowDiscardDialog(false)}
        onConfirm={handleDiscardConfirm}
        message="Are you sure you want to discard this workout in progress?"
      />

      {/* Routine Options Modal */}
      <RoutineOptionsModal
        open={showRoutineModal}
        onClose={handleRoutineModalClose}
        routine={selectedRoutine}
        onEdit={handleRoutineEdit}
        onDelete={handleRoutineDelete}
        onShare={handleRoutineShare}
        onDuplicate={handleRoutineDuplicate}
      />

      {/* Delete Routine Confirmation Modal */}
      <DeleteRoutineModal
        open={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          // Close routine options modal when delete confirmation is canceled
          handleRoutineModalClose();
        }}
        onConfirm={handleDeleteConfirm}
        routineName={selectedRoutine?.name}
      />

      {/* Create Folder Modal */}
      <FolderModal
        open={showCreateFolderModal}
        onClose={() => setShowCreateFolderModal(false)}
        onSave={async (name) => {
          try {
            const res = await workoutApi.createRoutineFolder(name);
            setFolders((prev) => [...prev, res.data]);
            setExpandedFolders((prev) => ({
              ...prev,
              [res.data._id]: true,
            }));
          } catch (err) {
            console.error("Error creating folder:", err);
          } finally {
            setShowCreateFolderModal(false);
          }
        }}
      />


      <RenameFolderModal
        open={showRenameFolderModal}
        currentName={selectedFolder?.name ?? ""}
        onClose={() => setShowRenameFolderModal(false)}
        onSave={handleRenameFolderSave}
      />



      <FolderOptionModal
        open={showFolderOptionModal}
        folderName={selectedFolder?.name ?? ""}
        onClose={() => setShowFolderOptionModal(false)}
        onRename={handleRenameFolder}
        onDeleteFolder={handleDeleteFolder}
        onAddNewRoutine={() => {
          if (selectedFolder) {
            router.push(`/workout/new-routine?folderId=${selectedFolder._id}`);
          } else {
            router.push("/workout/new-routine"); // fallback
          }
        }}
        onReorder={() => router.push("/workout/reorder-folders")}
      />

    </div>
  );
}
