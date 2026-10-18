
import { useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { ArrowSquareDown, User, Camera } from "iconsax-reactjs";
import Signoutbutton from "./SignoutButton";

export default function Userdata() {
  const token = localStorage.getItem("token");

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  });

  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handlePhotoChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image.");
      event.target.value = "";
      return;
    }

    if (!token) {
      setError("Please log in first.");
      event.target.value = "";
      return;
    }

    const formData = new FormData();
    formData.append("photo", file);

    setUploading(true);
    setError("");

    try {
      const response = await fetch(
        "https://route-posts.routemisr.com/users/upload-photo",
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to upload photo.");
      }

      const photo =
        data.data?.user?.photo ??
        data.data?.photo ??
        data.user?.photo ??
        data.photo;

      if (!photo) {
        throw new Error("Upload response did not contain a photo URL.");
      }

      const updatedUser = {
        ...user,
        ...(data.data?.user ?? data.user ?? {}),
        photo,
      };

      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  return (
    <div className="flex items-center gap-3 px-4 py-2">
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        title="Change profile photo"
        className="group relative h-12 w-12 shrink-0 overflow-hidden
                   rounded-full border border-[#2ccce4] bg-gray-100
                   disabled:cursor-wait disabled:opacity-60"
      >
        {user.photo ? (
          <img
            src={user.photo}
            alt="Profile"
            className="h-full w-full object-cover"
          />
        ) : (
          <User
            size="32"
            color="#2ccce4"
            className="mx-auto"
          />
        )}

        
        <span className="absolute inset-0 flex items-center justify-center
                         bg-black/60 opacity-0 transition
                         group-hover:opacity-100">
          <Camera size="22" color="#ffffff" />
        </span>

        {uploading && (
          <span className="absolute inset-0 flex items-center justify-center
                           bg-black/70 text-[9px] text-white">
            Uploading
          </span>
        )}
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handlePhotoChange}
        disabled={uploading}
      />

      <div className="min-w-0 flex-1">
        <h4 className="truncate text-sm font-semibold text-black">
          {user.name || "No Username"}
        </h4>

        <p className="truncate text-sm text-gray-600">
          {user.email || "No Email Found"}
        </p>

        {error && (
          <p className="mt-1 text-xs text-red-400">
            {error}
          </p>
        )}
      </div>

      <ArrowSquareDown
        size="32"
        color="#2ccce4"
        className="h-5 w-5 shrink-0"
      />

      <Signoutbutton />
    </div>
  );
}