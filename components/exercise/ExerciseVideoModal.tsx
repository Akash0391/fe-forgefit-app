"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Exercise } from "@/lib/api";

interface ExerciseVideoModalProps {
  exercise: Exercise | null;
  open: boolean;
  onClose: () => void;
}

export function ExerciseVideoModal({ exercise, open, onClose }: ExerciseVideoModalProps) {
  if (!exercise) return null;

  const mediaUrl = exercise.gifUrl || exercise.videoUrl;
  const isGif = exercise.gifUrl && !exercise.videoUrl;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-xl font-semibold">{exercise.name}</DialogTitle>
        </DialogHeader>
        <div className="p-6 pt-4">
          {mediaUrl ? (
            <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black">
              {isGif ? (
                <img
                  src={mediaUrl}
                  alt={exercise.name}
                  className="w-full h-full object-contain"
                />
              ) : (
                <video
                  src={mediaUrl}
                  controls
                  className="w-full h-full"
                  autoPlay
                >
                  Your browser does not support the video tag.
                </video>
              )}
            </div>
          ) : (
            <div className="w-full aspect-video flex items-center justify-center bg-gray-100 rounded-lg">
              <p className="text-gray-500">No media available</p>
            </div>
          )}
          {exercise.description && (
            <div className="mt-4">
              <h4 className="font-semibold mb-2">Description</h4>
              <p className="text-gray-600">{exercise.description}</p>
            </div>
          )}
          {exercise.instructions.length > 0 && (
            <div className="mt-4">
              <h4 className="font-semibold mb-2">Instructions</h4>
              <ol className="list-decimal list-inside space-y-2 text-gray-600">
                {exercise.instructions.map((instruction, index) => (
                  <li key={index}>{instruction}</li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

