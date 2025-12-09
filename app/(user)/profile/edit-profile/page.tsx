"use client";

import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import ProfileMediaSelectionModal from "@/components/ProfileMediaSelectionModal";
import SexModal from "@/components/SexModal";
import BirthdayModal from "@/components/BirthdayModal";
import { authApi } from "@/lib/api";

type BirthdayValue = {
  day: number;
  month: number; // 1-12
  year: number;
};

export default function EditProfilePage() {
  const router = useRouter();

  const { user, loading, isAuthenticated, setUser } = useAuth();
  const [showProfileMediaModal, setShowProfileMediaModal] = useState(false);
  const [showSexModal, setShowSexModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);

  const [avatar, setAvatar] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [link, setLink] = useState("");
  const [sex, setSex] = useState<"male" | "female" | "other" | "">("male");
  const [showBirthdayModal, setShowBirthdayModal] = useState(false);
  const [birthday, setBirthday] = useState<BirthdayValue | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // redirect if not logged in
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [loading, isAuthenticated, router]);

  const getBirthdayLabel = (val: BirthdayValue | null) => {
    if (!val) return "Add birthday";
    const d = new Date(val.year, val.month - 1, val.day);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  };

  // preload values from user when available
  useEffect(() => {
    if (user) {
      const u: any = user;
      setAvatar(u.avatar || null);
      setName(u.name || "");
      setBio(u.bio || "");
      setLink(u.link || "");
      setSex(u.sex || "");

      if (u.birthday) {
        const d = new Date(u.birthday);
        if (!Number.isNaN(d.getTime())) {
          setBirthday({
            day: d.getDate(),
            month: d.getMonth() + 1,
            year: d.getFullYear(),
          });
        }
      } else {
        setBirthday(null);
      }
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

  const handleDone = async () => {
  if (!user || isSaving) return;
  const u: any = user;

  const payload: any = {};

  // avatar
  if ((avatar || null) !== (u.avatar || null)) {
    payload.avatar = avatar;
  }

  // name, bio, link, sex
  if (name !== (u.name || "")) payload.name = name;
  if (bio !== (u.bio || "")) payload.bio = bio;
  if (link !== (u.link || "")) payload.link = link;
  if (sex !== (u.sex || "")) payload.sex = sex || null;

  // birthday comparison
  const originalBirthdayDate = u.birthday ? new Date(u.birthday) : null;
  const newBirthdayDate = birthday
    ? new Date(birthday.year, birthday.month - 1, birthday.day)
    : null;

  const birthdayChanged =
    (originalBirthdayDate && !newBirthdayDate) ||
    (!originalBirthdayDate && newBirthdayDate) ||
    (originalBirthdayDate &&
      newBirthdayDate &&
      (originalBirthdayDate.getFullYear() !== newBirthdayDate.getFullYear() ||
        originalBirthdayDate.getMonth() !== newBirthdayDate.getMonth() ||
        originalBirthdayDate.getDate() !== newBirthdayDate.getDate()));

  if (birthdayChanged) {
    payload.birthday = newBirthdayDate ? newBirthdayDate.toISOString() : null;
  }

  // nothing changed → just go back
  if (Object.keys(payload).length === 0) {
    router.back();
    return;
  }

  try {
    setIsSaving(true);
    const res = await authApi.updateProfile(payload);
    if (res.success && res.data) {
    setUser(res.data); // ✅ INSTANTLY UPDATES PROFILE PAGE WITHOUT REFRESH
}
    // optionally: refresh auth context if you expose a reload function
    router.back();
  } catch (err) {
    console.error("Failed to update profile", err);
    // TODO: show toast/error UI if you want
  } finally {
    setIsSaving(false);
  }
};


  if (loading || !isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // TODO: wire these to actually pick / upload an image
  const handleTakePhoto = () => {
    console.log("Take photo clicked");
    // setAvatar(newUrl)
  };

  const handleSelectFromLibrary = () => {
    console.log("Select from library clicked");
    // setAvatar(newUrl)
  };

  const handleDeletePicture = () => {
    console.log("Delete picture clicked");
    setAvatar(null);
  };

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
          disabled={isSaving}
          className="text-blue-500 text-lg font-regular disabled:opacity-50"
        >
          {isSaving ? "Saving..." : "Done"}
        </button>
      </div>

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto px-6 pt-6 pb-24">
        {/* Avatar */}
        <div className="flex flex-col items-center mb-8">
          <Avatar className="w-28 h-28 mb-3">
            <AvatarImage src={avatar || ""} alt={user.name} />
            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
          </Avatar>

          <Button
            onClick={() => setShowProfileMediaModal(true)}
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
              <p className="text-lg font-regular text-gray-400">Private Data</p>
              <button
                onClick={() => setShowInfoModal(true)}
                className="flex items-center justify-center rounded-full bg-gray-200 p-1 hover:bg-gray-300 transition-colors"
              >
                <Image
                  src="/icons/punctuation-marks.png"
                  alt="Info"
                  width={12}
                  height={12}
                />
              </button>
            </div>
          </div>

          {/* Sex */}
          <div className="border-b border-gray-100 py-3 pb-6 flex items-center justify-between">
            <p className="text-lg text-black font-regular">Sex</p>
            <button
              onClick={() => setShowSexModal(true)}
              className="text-blue-500 text-lg"
            >
              {sex ? sex[0].toUpperCase() + sex.slice(1) : "Not set"}
            </button>
          </div>

          {/* Birthday */}
          <div className="border-b border-gray-100 py-3 pt-6 pb-6 flex items-center justify-between">
            <p className="text-lg text-black font-regular">Birthday</p>
            <button
              className="text-blue-500 text-lg"
              onClick={() => setShowBirthdayModal(true)}
            >
              {getBirthdayLabel(birthday)}
            </button>
          </div>
        </section>
      </div>

      <ProfileMediaSelectionModal
        open={showProfileMediaModal}
        onClose={() => setShowProfileMediaModal(false)}
        onTakePhoto={handleTakePhoto}
        onDeletePicture={handleDeletePicture}
        onSelectFromLibrary={handleSelectFromLibrary}
      />

      <SexModal
        open={showSexModal}
        onClose={() => setShowSexModal(false)}
        selectedSex={sex}
        onMale={() => setSex("male")}
        onFemale={() => setSex("female")}
        onOther={() => setSex("other")}
      />

      <BirthdayModal
        open={showBirthdayModal}
        onClose={() => setShowBirthdayModal(false)}
        value={birthday}
        onChange={(val) => setBirthday(val)}
      />

      {/* Info Modal */}
      {showInfoModal && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/50 z-[60] transition-opacity duration-300 ease-in-out"
            onClick={() => setShowInfoModal(false)}
          />
          {/* Modal Content - Center */}
          <div
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[60] bg-white rounded-[12px] shadow-lg transition-all duration-300 ease-in-out w-[90%] max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className=" text-center px-6">
              <h2 className="text-xl font-bold text-black mt-8">Private Data</h2>
            </div>
            <div className="px-6 pb-6 pt-0">
              <p className="text-lg font-regular text-gray-700 mb-8 mt-2 text-center">
                Your private data will not be displaayed on your public profile.
                ForgeFit will use this data to tailor features to your specific
                demograpghic. We'll also be adding more features for comparing
                exercises and progress between accounts. Having age and sex will
                allow you to compare yourself to atheletes in your specific
                demograpghic.
              </p>
              <button
                onClick={() => setShowInfoModal(false)}
                className="w-full py-3 px-4 bg-blue-500 text-white rounded-[10px] font-regular text-lg hover:bg-blue-600 transition-colors"
              >
                Ok
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
