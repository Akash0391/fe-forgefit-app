import { z } from "zod";

export const createExerciseSchema = z.object({
  title: z.string().min(1, "Add exercise name"),
  equipment: z.string().min(1, "Please select"),
  primaryMuscle: z.string().min(1, "Please select"),
  exerciseType: z.string().min(1, "Please select"),
  otherMuscles: z.string().optional(),
});

export type CreateExerciseForm = z.infer<typeof createExerciseSchema>;
