import { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { Back } from "iconsax-reactjs";
import { useForm } from "react-hook-form";

type RegisterFormData = {
  name: string;
  username: string;
  email: string;
  password: string;
  rePassword: string;
  dateOfBirth: string;
  gender: string;
};

export default function Register() {
  const navigate = useNavigate();
  const [message, setMessage] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>();

  const password = watch("password");

  const handleRegister = async (data: RegisterFormData) => {
    try {
      setMessage("");

      const response = await axios.post(
        "https://route-posts.routemisr.com/users/signup",
        data
      );

      console.log("Response:", response.data);

      const token = response.data.data.token;
      const user = response.data.data.user;

      console.log("Token:", token);
      console.log("User:", user);

      // Save token
      localStorage.setItem("token", token);

      // Save user
      localStorage.setItem("user", JSON.stringify(user));

      setMessage("Account created successfully!");

      // Reset form
      reset();

      // Go to login
      navigate("/home");
    } catch (error: any) {
      console.log(
        "Error:",
        error.response?.data || error.message
      );

      setMessage(
        error.response?.data?.message ||
          error.message ||
          "Registration failed!"
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <form
        onSubmit={handleSubmit(handleRegister)}
        className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl space-y-5"
      >
        {/* Name */}
        <div>
          <label
            htmlFor="name"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Name
          </label>

          <input
            type="text"
            id="name"
            placeholder="Enter your Name"
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            {...register("name", {
              required: "Name is required",
              minLength: {
                value: 3,
                message: "Name must be at least 3 characters",
              },
            })}
          />

          {errors.name && (
            <p className="mt-1 text-sm text-red-600">
              {errors.name.message}
            </p>
          )}
        </div>

        {/* Username */}
        <div>
          <label
            htmlFor="username"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            User Name
          </label>

          <input
            type="text"
            id="username"
            placeholder="Enter your username"
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            {...register("username", {
              required: "Username is required",
              minLength: {
                value: 3,
                message: "Username must be at least 3 characters",
              },
            })}
          />

          {errors.username && (
            <p className="mt-1 text-sm text-red-600">
              {errors.username.message}
            </p>
          )}
        </div>

        {/* Email */}
        <div>
          <label
            htmlFor="email"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Email
          </label>

          <input
            type="email"
            id="email"
            placeholder="Enter your email"
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            {...register("email", {
              required: "Email is required",
              pattern: {
                value: /^\S+@\S+\.\S+$/,
                message: "Please enter a valid email",
              },
            })}
          />

          {errors.email && (
            <p className="mt-1 text-sm text-red-600">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password */}
        <div>
          <label
            htmlFor="password"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Password
          </label>

          <input
            type="password"
            id="password"
            placeholder="Enter your password"
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            {...register("password", {
              required: "Password is required",
              minLength: {
                value: 6,
                message: "Password must be at least 6 characters",
              },
            })}
          />

          {errors.password && (
            <p className="mt-1 text-sm text-red-600">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label
            htmlFor="rePassword"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Confirm Password
          </label>

          <input
            type="password"
            id="rePassword"
            placeholder="Confirm your password"
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            {...register("rePassword", {
              required: "Please confirm your password",
              validate: (value) =>
                value === password || "Passwords do not match",
            })}
          />

          {errors.rePassword && (
            <p className="mt-1 text-sm text-red-600">
              {errors.rePassword.message}
            </p>
          )}
        </div>

        {/* Birth Date */}
        <div>
          <label
            htmlFor="dateOfBirth"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Birth Date
          </label>

          <input
            type="date"
            id="dateOfBirth"
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            {...register("dateOfBirth", {
              required: "Birth date is required",
            })}
          />

          {errors.dateOfBirth && (
            <p className="mt-1 text-sm text-red-600">
              {errors.dateOfBirth.message}
            </p>
          )}
        </div>

        {/* Gender */}
        <div>
          <label
            htmlFor="gender"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Gender
          </label>

          <select
            id="gender"
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            {...register("gender", {
              required: "Please select your gender",
            })}
          >
            <option value="">Select your gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>

          {errors.gender && (
            <p className="mt-1 text-sm text-red-600">
              {errors.gender.message}
            </p>
          )}
        </div>

        {/* Message */}
        {message && (
          <p className="text-center text-sm font-medium text-red-700">
            {message}
          </p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-blue-400"
        >
          {isSubmitting ? "Creating Account..." : "Sign Up"}
        </button>

        {/* Back to Login */}
        <div className="flex items-center justify-center hover:cursor-pointer">
          <Back size="32" color="#2ccce4" />

          <Link to="/" className="text-black ml-1">
            Back to Login
          </Link>
        </div>
      </form>
    </div>
  );
}