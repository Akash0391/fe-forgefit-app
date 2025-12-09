"use client";

import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

export default function EditProfilePage() {
    const router = useRouter();

    const { user, loading, isAuthenticated } = useAuth();

    const [name, setName] = useState("");
    const [bio, setBio] = useState("");
    const [link, setLink] = useState("");

    // redirect if not logged in
    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.push("/login");
        }
    }, [loading, isAuthenticated, router]);

    // preload values from user when available
    useEffect(() => {
        if (user) {
            setName(user.name || "");
            // adjust these keys if your user model uses different field names
            setBio((user as any).bio || "");
            setLink((user as any).link || "");
        }
    }, [user]);

    const getInitials = (fullName?: string) => {
        if (!fullName) return "U";
        return fullName
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    const handleDone = () => {
        // later you can save data here
        router.back(); // go back to profile page
    };

    if (loading || !isAuthenticated || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <p className="text-muted-foreground">Loading...</p>
            </div>
        );
    }


    return (
        <div className="min-h-screen flex flex-col bg-white">
            {/* HEADER */}
            <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-gray-100">
                <button
                    className="p-1 -ml-1"
                    onClick={() => router.back()}
                    aria-label="Back"
                >
                    <ArrowLeft className="size-7" />
                </button>

                <h1 className="text-lg font-regular">Edit Profile</h1>

                <button
                    onClick={handleDone}
                    className="text-blue-500 text-lg font-regular"
                >
                    Done
                </button>
            </div>

            {/* CONTENT */}
            <div className="flex-1 overflow-y-auto px-6 pt-6 pb-24">
                {/* Avatar */}
                <div className="flex flex-col items-center mb-8">
                    <Avatar className="w-28 h-28 mb-3">
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                    </Avatar>

                    <Button
                        variant="ghost"
                        className="text-blue-500 text-lg font-semibold"
                    >
                        Change Picture
                    </Button>
                </div>

                {/* Public profile data */}
                <section className="mb-8">
                    <p className="text-lg text-gray-500 mb-3">Public profile data</p>

                    {/* Name */}
                    <div className="py-3 pb-6 flex flex-row gap-20 items-center border-b border-gray-100">
                        <p className="text-lg text-black mb-1">Name</p>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="border-0 px-0 shadow-none h-7 text-lg focus-visible:ring-0"
                        />
                    </div>

                    {/* Bio */}
                    <div className="py-3 mt-3 pb-6 flex flex-row gap-25  border-b border-gray-100">
                        <p className="text-lg text-black mb-1">Bio</p>
                        <Input
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            placeholder="Describe yourself"
                            className="border-0 px-0 shadow-none h-20 text-lg font-regular placeholder:text-gray-400 focus-visible:ring-0"
                        />
                    </div>

                    {/* Link */}
                    <div className="py-3 mt-3 pb-6 flex flex-row gap-23  border-b border-gray-100">
                        <p className="text-lg text-black mb-1">Link</p>
                        <Input
                            value={link}
                            onChange={(e) => setLink(e.target.value)}
                            placeholder="https://example.com"
                            className="border-0 px-0 shadow-none h-15 text-lg font-regular placeholder:text-gray-400 focus-visible:ring-0"
                        />
                    </div>
                </section>

                {/* Private data */}
                <section>
                    <div className="mb-6 mt-12 ">
                        <div className="flex items-center gap-2">
                            <p className="text-lg font-regular text-gray-500">
                                Public Data
                            </p>
                            <button
                                onClick={() => { }}
                                className="flex items-center justify-center rounded-full bg-gray-200 p-1 hover:bg-gray-300 transition-colors"
                            >
                                <Image src="/icons/punctuation-marks.png" alt="Info" width={12} height={12} />
                            </button>
                        </div>
                    </div>

                    {/* Sex */}
                    <div className="border-b border-gray-100 py-3 pb-6 flex items-center justify-between">
                        <p className="text-lg text-black font-regular">Sex</p>
                        <button className="text-blue-500 text-lg">Male</button>
                    </div>

                    {/* Birthday */}
                    <div className="border-b border-gray-100 py-3 mt-3 pb-6 flex items-center justify-between">
                        <p className="text-lg text-black font-regular">Birthday</p>
                        <button className="text-blue-500 text-lg">Nov 11, 2007</button>
                    </div>
                </section>
            </div>

            {/* Bottom nav is already on your main layout, so no need to repeat here */}
        </div>
    );
}
