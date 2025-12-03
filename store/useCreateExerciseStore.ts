"use client";

import { create } from "zustand";

interface CreateExerciseState {
  title: string;
  equipment: string | null;
  primaryMuscle: string | null;
  otherMuscles: string | null;
  exerciseType: string | null;
  isSaving: boolean;

  // actions
  setTitle: (title: string) => void;
  setEquipment: (equipment: string | null) => void;
  setPrimaryMuscle: (muscle: string | null) => void;
  setOtherMuscles: (muscles: string | null) => void;
  setExerciseType: (type: string | null) => void;
  setIsSaving: (saving: boolean) => void;
  reset: () => void;
}

export const useCreateExerciseStore = create<CreateExerciseState>((set) => ({
  title: "",
  equipment: null,
  primaryMuscle: null,
  otherMuscles: null,
  exerciseType: null,
  isSaving: false,

  setTitle: (title) => set({ title }),
  setEquipment: (equipment) => set({ equipment }),
  setPrimaryMuscle: (primaryMuscle) => set({ primaryMuscle }),
  setOtherMuscles: (otherMuscles) => set({ otherMuscles }),
  setExerciseType: (exerciseType) => set({ exerciseType }),
  setIsSaving: (isSaving) => set({ isSaving }),

  reset: () =>
    set({
      title: "",
      equipment: null,
      primaryMuscle: null,
      otherMuscles: null,
      exerciseType: null,
      isSaving: false,
    }),
}));
