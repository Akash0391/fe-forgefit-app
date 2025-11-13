"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown, RotateCw, Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { exerciseApi, Exercise } from "@/lib/api";
import { ExerciseCard } from "@/components/exercise/ExerciseCard";
import { ExerciseVideoModal } from "@/components/exercise/ExerciseVideoModal";

export default function AddExercisePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isReplaceMode = searchParams.get("mode") === "replace";
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [selectedExerciseIds, setSelectedExerciseIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pagination, setPagination] = useState<{ total: number; pages: number } | null>(null);

  useEffect(() => {
    fetchExercises();
  }, []);

  const fetchExercises = async (pageNum: number = 1, append: boolean = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);
      console.log("Fetching exercises...");
      const response = await exerciseApi.getAll({ limit: 200, page: pageNum });
      console.log("Exercises response:", response);
      if (response.success) {
        console.log(`Loaded ${response.data.length} exercises`);
        if (append) {
          setExercises(prev => [...prev, ...response.data]);
        } else {
          setExercises(response.data);
        }
        setPagination(response.pagination);
        setHasMore(pageNum < response.pagination.pages);
        setPage(pageNum);
      } else {
        console.error("API returned success=false:", response);
        setError("Failed to load exercises. Please try again.");
      }
    } catch (error) {
      console.error("Error fetching exercises:", error);
      setError("Failed to load exercises. Please try again.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMoreExercises = () => {
    if (!loadingMore && hasMore) {
      fetchExercises(page + 1, true);
    }
  };

  const handleSearch = async () => {
    try {
      setLoading(true);
      setError(null);
      setPage(1);
      const response = await exerciseApi.getAll({
        search: searchQuery,
        limit: 200,
        page: 1
      });
      if (response.success) {
        setExercises(response.data);
        setPagination(response.pagination);
        setHasMore(1 < response.pagination.pages);
      }
    } catch (error) {
      console.error("Error searching exercises:", error);
      setError("Failed to search exercises. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleExerciseClick = (exercise: Exercise) => {
    // If in replace mode, immediately replace and navigate back
    if (isReplaceMode) {
      const replaceExerciseId = sessionStorage.getItem("replaceExerciseId");
      
      if (replaceExerciseId) {
        // Get existing workout exercises from localStorage
        const existingExercisesJson = localStorage.getItem("workoutExercises");
        const existingExercises = existingExercisesJson 
          ? JSON.parse(existingExercisesJson) 
          : [];
        
        // Find the index of the exercise to replace
        const replaceIndex = existingExercises.findIndex(
          (ex: Exercise) => ex._id === replaceExerciseId
        );
        
        if (replaceIndex !== -1) {
          // Replace the exercise at that index with the selected one
          const newExercises = [...existingExercises];
          newExercises[replaceIndex] = exercise;
          
          // Save back to localStorage
          localStorage.setItem("workoutExercises", JSON.stringify(newExercises));
          
          // Dispatch a custom event to notify other components
          window.dispatchEvent(new Event("workoutExercisesUpdated"));
          
          // Clear the replace exercise ID from sessionStorage
          sessionStorage.removeItem("replaceExerciseId");
          
          console.log("Replaced exercise:", exercise);
          router.back();
          return;
        }
      }
    }
    
    // Normal mode: toggle selection
    setSelectedExerciseIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(exercise._id)) {
        newSet.delete(exercise._id);
      } else {
        newSet.add(exercise._id);
      }
      return newSet;
    });
  };

  const handleVideoIconClick = (exercise: Exercise, e: React.MouseEvent) => {
    e.stopPropagation();
    if (exercise.gifUrl || exercise.videoUrl) {
      setSelectedExercise(exercise);
      setShowVideoModal(true);
    }
  };

  const handleCreate = () => {
    // Add logic to add selected exercise to workout
    window.location.reload();
  };

  const handleAddExercises = () => {
    // Get selected exercises from the exercises list
    const selectedExercises = exercises.filter(exercise => 
      selectedExerciseIds.has(exercise._id)
    );
    
    if (isReplaceMode) {
      // Replace mode: replace the exercise with the selected one
      const replaceExerciseId = sessionStorage.getItem("replaceExerciseId");
      
      if (replaceExerciseId && selectedExercises.length > 0) {
        // Get existing workout exercises from localStorage
        const existingExercisesJson = localStorage.getItem("workoutExercises");
        const existingExercises = existingExercisesJson 
          ? JSON.parse(existingExercisesJson) 
          : [];
        
        // Find the index of the exercise to replace
        const replaceIndex = existingExercises.findIndex(
          (ex: Exercise) => ex._id === replaceExerciseId
        );
        
        if (replaceIndex !== -1) {
          // Replace the exercise at that index with the selected one
          const newExercises = [...existingExercises];
          newExercises[replaceIndex] = selectedExercises[0];
          
          // Save back to localStorage
          localStorage.setItem("workoutExercises", JSON.stringify(newExercises));
          
          // Dispatch a custom event to notify other components
          window.dispatchEvent(new Event("workoutExercisesUpdated"));
          
          // Clear the replace exercise ID from sessionStorage
          sessionStorage.removeItem("replaceExerciseId");
          
          console.log("Replaced exercise:", selectedExercises[0]);
          router.back();
          return;
        }
      }
    }
    
    // Normal add mode: add exercises to the workout
    // Get existing workout exercises from localStorage
    const existingExercisesJson = localStorage.getItem("workoutExercises");
    const existingExercises = existingExercisesJson 
      ? JSON.parse(existingExercisesJson) 
      : [];
    
    // Combine existing exercises with new ones (avoid duplicates)
    const exerciseMap = new Map();
    
    // Add existing exercises
    existingExercises.forEach((ex: Exercise) => {
      exerciseMap.set(ex._id, ex);
    });
    
    // Add new exercises (will overwrite if duplicate, but that's fine)
    selectedExercises.forEach((ex: Exercise) => {
      exerciseMap.set(ex._id, ex);
    });
    
    // Save back to localStorage
    const allExercises = Array.from(exerciseMap.values());
    localStorage.setItem("workoutExercises", JSON.stringify(allExercises));
    
    // Dispatch a custom event to notify other components
    window.dispatchEvent(new Event("workoutExercisesUpdated"));
    
    console.log("Added exercises to workout:", selectedExercises);
    router.back();
  };

  const filteredExercises = exercises.filter(exercise =>
    exercise.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 flex flex-col bg-background">
      {/* Fixed Header */}
      <header className="flex-shrink-0 bg-background border-b border-border">
        <div className="flex items-center justify-between h-16 px-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="h-10 px-0 hover:bg-transparent"
            aria-label="Go back"
          >
            <span className="text-lg font-regular text-blue-600">
              Cancel
            </span>
          </Button>

          <h1 className="text-lg font-regular capitalize">
            {isReplaceMode ? "Replace Exercise" : "add exercise"}
          </h1>

          <Button
            variant="ghost"
            onClick={handleCreate}
            className="h-10 px-0 hover:bg-transparent"
            aria-label="Create"
          >
            <span className="text-lg font-regular text-blue-600">
              Create
            </span>
          </Button>
        </div>
      </header>

      {/* Fixed Search and Filter Section */}
      <div className="flex-shrink-0 p-4 space-y-4 bg-background">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 size-5 text-gray-400 pointer-events-none z-10" />
          <Input
            placeholder="Search exercise"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full h-12 pl-12 pr-4 text-base rounded-[8px] bg-gray-100 border-none outline-none placeholder:text-gray-400 transition-colors"
          />
        </div>

        <div className="flex flex-row items-center gap-3">
          <Button 
            variant="default" 
            className="flex-1 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-black rounded-[8px] py-3 h-auto font-regular text-base border-none shadow-none transition-colors"
          >
            All Equipment
          </Button>
          <Button 
            variant="default" 
            className="flex-1 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-black rounded-[8px] py-3 h-auto font-regular text-base border-none shadow-none transition-colors"
          >
            All Muscles
          </Button>
        </div>

        {error && (
          <div className="text-red-500 text-sm">{error}</div>
        )}
      </div>

      {/* Scrollable Exercise Cards Area */}
      <div 
        className="flex-1 overflow-y-auto"
        onScroll={(e) => {
          const target = e.target as HTMLDivElement;
          const scrollBottom = target.scrollHeight - target.scrollTop - target.clientHeight;
          if (scrollBottom < 200 && !loadingMore && hasMore) {
            loadMoreExercises();
          }
        }}
      >
        <div className="p-4">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading exercises...</div>
          ) : filteredExercises.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchQuery ? "No exercises found matching your search." : "No exercises available."}
            </div>
          ) : (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-black">Popular Exercises</h2>
              {filteredExercises.map((exercise) => (
                <ExerciseCard
                  key={exercise._id}
                  exercise={exercise}
                  isSelected={selectedExerciseIds.has(exercise._id)}
                  onClick={() => handleExerciseClick(exercise)}
                  onVideoClick={(e) => handleVideoIconClick(exercise, e)}
                />
              ))}
              {loadingMore && (
                <div className="text-center py-4 text-gray-500">Loading more exercises...</div>
              )}
              {!hasMore && filteredExercises.length > 0 && (
                <div className="text-center py-4 text-gray-500 text-sm">
                  All exercises loaded ({filteredExercises.length} total)
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Button - Appears when exercises are selected (only in normal add mode) */}
      {selectedExerciseIds.size > 0 && !isReplaceMode && (
        <div className="flex-shrink-0 p-4 bg-background">
          <Button
            onClick={handleAddExercises}
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-[8px] font-regular text-lg"
          >
            Add {selectedExerciseIds.size} {selectedExerciseIds.size === 1 ? 'exercise' : 'exercises'}
          </Button>
        </div>
      )}

      <ExerciseVideoModal
        exercise={selectedExercise}
        open={showVideoModal}
        onClose={() => setShowVideoModal(false)}
      />
    </div>
  );
}
