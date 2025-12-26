"use client";

import Modal from "@/components/Model";
import { useFormik } from "formik";
import { useCallback } from "react";
import { toast } from "react-toastify";

import PasswordField from "@/components/common/PasswordField";
import { useUserRegistration } from "@/queries/auth/auth";
import type { RegisterUserPayload } from "@/utils/types/auth";
import { userRegisterSchema } from "@/utils/validationSchema/userSchema";

interface UserRegistrationFormProps {
  onCancel: () => void;
  refetchData?: () => void;
}

const UserRegistrationForm = ({ onCancel, refetchData }: UserRegistrationFormProps) => {
  const { isPending, mutate } = useUserRegistration();

  const handleRegister = useCallback(
    (payload: RegisterUserPayload) => {
      mutate(payload, {
        onSuccess: (data) => {
          if (data.status) {
            toast.success(data.message ?? "User registered successfully");
            refetchData?.();
            onCancel();
          } else {
            toast.error(data.message ?? "Registration failed");
          }
        },
        onError: (error) => {
          toast.error(error.message ?? "Something went wrong");
        },
      });
    },
    [mutate, onCancel, refetchData]
  );

  const formik = useFormik<RegisterUserPayload>({
    initialValues: {
      name: "",
      mobile: "",
      password: "",
      role: "User",
    },
    validationSchema: userRegisterSchema,
    onSubmit: handleRegister,
  });

  const { values, handleChange, handleBlur, handleSubmit, touched, errors } = formik;

  return (
    <Modal onClose={onCancel} isLoading={isPending}>
      <h3 className="mb-6 text-center text-xl font-semibold text-bgPrimaryDark">
        Register New User
      </h3>

      <form onSubmit={handleSubmit} className="mx-auto w-full max-w-lg space-y-6">
        {/* Name */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-bgPrimaryDark">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            name="name"
            value={values.name}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Full name"
            className={`w-full rounded-xl px-4 py-3 text-sm ${
              touched.name && errors.name
                ? "border border-red-500"
                : "border border-bgPrimary/30 bg-white"
            }`}
          />
          <p className="min-h-4 text-xs text-red-500">{touched.name && errors.name}</p>
        </div>

        {/* Mobile */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-bgPrimaryDark">
            Mobile Number <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            name="mobile"
            maxLength={10}
            value={values.mobile}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="10-digit mobile number"
            className={`w-full rounded-xl px-4 py-3 text-sm ${
              touched.mobile && errors.mobile
                ? "border border-red-500"
                : "border border-bgPrimary/30 bg-white"
            }`}
          />
          <p className="min-h-4 text-xs text-red-500">{touched.mobile && errors.mobile}</p>
        </div>

        {/* Password */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-bgPrimaryDark">
            Password <span className="text-red-500">*</span>
          </label>
          <PasswordField
            name="password"
            value={values.password}
            onChange={handleChange}
            onBlur={handleBlur}
            touched={touched.password}
            error={errors.password}
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-full bg-bgPrimaryDark py-3 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed"
        >
          {isPending ? "Registering..." : "Register User"}
        </button>
      </form>
    </Modal>
  );
};

export default UserRegistrationForm;
