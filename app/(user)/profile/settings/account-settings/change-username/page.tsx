'use client';
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, ChevronRight, Lock, Mail, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authApi } from "@/lib/api";

export default function ChangeUsernamePage() {
    const router = useRouter();
    const { user, setUser } = useAuth();
    const [name, setName] = useState(user?.name || "");
const isChanged = name.trim() !== user?.name;

const handleUpdate = async () => {
  const res = await authApi.updateProfile({ name });
  setUser(res.data); // update profile page instantly
  router.back();
};

    return (
        <div className="min-h-screen flex flex-col bg-gray-100">
            {/* HEADER */}
            <div className="sticky top-0 z-40 bg-white relative flex items-center px-4 pt-4 pb-3 border-b border-gray-100">

                {/* Back button */}
                <button
                    className="p-1 -ml-1"
                    onClick={() => router.back()}
                    aria-label="Back"
                >
                    <ArrowLeft className="size-5" />
                </button>

                {/* Centered title */}
                <h1 className="absolute left-1/2 -translate-x-1/2 text-sm font-normal">
                    Change Username
                </h1>

            </div>

            {/* Main Content */}
            <div className="">

                <div className="p-4 bg-white">
                    <div className="mb-4">
                        <label htmlFor="username" className="block text-sm font-medium text-gray-600 mb-3">
                            Username
                        </label>
                        <input
                            type="text"
                            id="username"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full py-2 mb-4 px-1 border-none rounded-md focus:outline-none text-sm"
                            placeholder="Enter new username"
                        />
                    </div>
                    <Button onClick={handleUpdate} disabled={!isChanged} className="w-full bg-blue-500 text-white py-6 px-4 rounded-md hover:bg-blue-600 rounded-[10px]">
                        Update
                    </Button>
                </div>
            </div>
        </div>
    );
}
