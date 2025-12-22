"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { X, GripHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { workoutApi } from "@/lib/api"; // ✅ correct import from YOUR api.ts
import type { RoutineFolder } from "@/lib/api"; // ✅ reuse your type
// dnd-kit imports
import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from "@dnd-kit/core";
import {
    SortableContext,
    verticalListSortingStrategy,
    useSortable,
    arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// One row in the list (draggable)
function SortableFolderItem({ folder }: { folder: RoutineFolder }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: folder._id });

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.6 : 1,
        cursor: "grab",
    };

    return (
        <li
            ref={setNodeRef}
            style={style}
            className="flex items-center justify-between"
            {...attributes}
            {...listeners}
        >
            <span className="text-lg">{folder.name}</span>

            {/* drag handle */}
            <div className="flex-shrink-0 text-gray-400 flex flex-col gap-1.5">
                <div className="w-7 h-0.5 bg-gray-500" />
                <div className="w-7 h-0.5 bg-gray-500" />
                <div className="w-7 h-0.5 bg-gray-500" />
            </div>
        </li>
    );
}

export default function ReorderFoldersPage() {
    const router = useRouter();
    const [folders, setFolders] = useState<RoutineFolder[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 5 }, // small movement before drag starts
        })
    );

    useEffect(() => {
        const loadFolders = async () => {
            try {
                const res = await workoutApi.getRoutineFolders();

                // ✅ sort using backend order field
                const sorted = [...res.data].sort(
                    (a, b) => (a.order ?? 0) - (b.order ?? 0)
                );

                setFolders(sorted);
            } catch (err) {
                console.error("Failed to load routine folders:", err);
            } finally {
                setLoading(false);
            }
        };

        loadFolders();
    }, []);

    // Handle drag end → reorder state
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        setFolders((items) => {
            const oldIndex = items.findIndex((f) => f._id === active.id);
            const newIndex = items.findIndex((f) => f._id === over.id);
            if (oldIndex === -1 || newIndex === -1) return items;
            return arrayMove(items, oldIndex, newIndex);
        });
    };

    // Save new order then go back
    const handleDone = async () => {
        try {
            setSaving(true);

            const payload = folders.map((folder, index) => ({
                folderId: folder._id,
                order: index, // or index + 1 if you prefer starting at 1
            }));

            await workoutApi.reorderRoutineFolders(payload);

            // When you go back, workout page will re-fetch folders
            router.back();
        } catch (err) {
            console.error("Failed to save folder order:", err);
            // here you could show a toast
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="flex h-screen flex-col bg-white">

            {/* Header */}
            <header className="sticky top-0 z-40 bg-background flex items-center justify-center border-b border-gray-100 px-4 py-4">
                <h1 className="text-lg font-regular">Reorder Folders</h1>
            </header>

            {/* Folder List */}
            <main className="flex-1 px-5 py-6 overflow-y-auto">
                {folders.length === 0 ? (
                    <p className="text-center text-gray-500">No folders found</p>
                ) : (
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={folders.map((f) => f._id)}
                            strategy={verticalListSortingStrategy}
                        >
                            <ul className="space-y-10 pb-4">
                                {folders.map((folder) => (
                                    <SortableFolderItem key={folder._id} folder={folder} />
                                ))}
                            </ul>
                        </SortableContext>
                    </DndContext>
                )}
            </main>

            {/* Bottom Done button */}
            <div className="px-4 py-4">
                <Button
                    className="h-16 w-full rounded-2xl bg-blue-500 text-lg font-regular"
                    onClick={handleDone}
                >
                    Done
                </Button>
            </div>
        </div>
    );

}
