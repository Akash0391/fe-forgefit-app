import { Workout, SetData } from "@/lib/api";

type WorkoutShareCardProps = {
    workout: Workout;
    durationText: string;
    volumeText: string;
    setsText: string;
    variant: 0 | 1 | 2 | 3;
    username: string;

};

export default function WorkoutShareCard({
    workout,
    durationText,
    volumeText,
    setsText,
    variant,
    username
}: WorkoutShareCardProps) {
    const firstExercise = workout.exercises[0];
    const exerciseName =
        firstExercise && typeof firstExercise.exerciseId === "object"
            ? firstExercise.exerciseId.name
            : "Exercise";

    const setsCount = workout.exercises.reduce(
        (sum, ex) => sum + ex.sets.filter((s: SetData) => s.completed).length,
        0
    );

    const exerciseCount = workout.exercises.length;

    // Variant 0
    if (variant === 0) {
        return (
            <div className="w-full h-full bg-white rounded-[24px] shadow-lg px-6 py-8 flex flex-col justify-between">
                <div className="flex flex-col gap-7">
                    <h2 className="text-2xl font-semibold">
                        {workout.name || "Workout"} 🌞
                    </h2>
                    <div className="flex gap-8 text-lg">
                        <div>
                            <div className="text-xl text-gray-800">Duration</div>
                            <div className="font-semibold text-2xl">{durationText}</div>
                        </div>
                        <div>
                            <div className="text-xl text-gray-800">Volume</div>
                            <div className="font-semibold text-2xl">{volumeText}</div>
                        </div>
                        <div>
                            <div className="text-xl text-gray-800">Sets</div>
                            <div className="font-semibold text-2xl">{setsText}</div>
                        </div>
                    </div>

                    <div className=" text-base">
                        <span className="text-blue-500 font-semibold text-2xl">{exerciseCount}x </span>
                        <span className="text-xl">{exerciseName}</span>
                    </div>
                </div>

                <div className="mt-6 text-2xl text-black flex justify-between">
                    <span className="font-bold">Forgefit</span>
                    <span>@{username}</span>
                </div>
            </div>
        );
    }

    // Variant 1
    if (variant === 1) {
        return (
            <div className="w-full h-full bg-white rounded-[24px] shadow-lg px-6 py-8 flex flex-col justify-between">
                <div className="flex flex-col gap-7 mt-15">
                    <h2 className="text-3xl font-semibold mb-4">
                        {workout.name || "Workout"} 🌞
                    </h2>

                    <div className="grid grid-cols-2 gap-y-8 text-start">
                        <div>
                            <div className="font-semibold text-4xl">{durationText}</div>
                            <div className="text-xl text-gray-800">Duration</div>
                        </div>
                        <div>
                            <div className="font-semibold text-4xl">{volumeText}</div>
                            <div className="text-xl text-gray-800">Volume</div>
                        </div>
                        <div>
                            <div className="font-semibold text-4xl">{exerciseCount}</div>
                            <div className="text-xl text-gray-800">Exercise</div>
                        </div>
                        <div>
                            <div className="font-semibold text-4xl">{setsText}</div>
                            <div className="text-xl text-gray-800">Sets</div>
                        </div>
                    </div>
                </div>
                <div className="mt-6 text-2xl text-black flex justify-between">
                    <span className="font-bold">Forgefit</span>
                    <span>@{username}</span>
                </div>
            </div>
        );
    }

    // Variant 2 / default
    return (
        <div className="w-full h-full bg-white rounded-[24px] shadow-lg px-6 py-8 flex flex-col justify-center">

            <div className="flex flex-col items-center mt-6 space-y-4">
                <div className="text-center">
                    <div className="text-2xl font-semibold">{durationText}</div>
                    <div className="text-xl text-gray-500">Duration</div>
                </div>
                <div className="text-center">
                    <div className="text-2xl font-semibold">{volumeText}</div>
                    <div className="text-xl text-gray-500">Volume</div>
                </div>
                <div className="text-center">
                    <div className="text-2xl font-semibold">{setsText}</div>
                    <div className="text-xl text-gray-500">Sets</div>
                </div>
                <div className="mt-6 text-center text-black flex flex-col justify-between">
                    <span className="text-2xl font-bold">Forgefit</span>
                    <span className="text-xm">@{username}</span>
                </div>
            </div>

        </div>
    );
}
