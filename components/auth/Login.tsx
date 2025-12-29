"use client";

import { useFormik } from "formik";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { toast } from "react-toastify";
import * as Yup from "yup";

import { useUserLogin } from "@/queries/auth/auth";
import PasswordField from "../common/PasswordField";

/* -----------------------------
 Validation Schema
------------------------------ */
const loginSchema = Yup.object({
  mobile: Yup.string()
    .required("Mobile number is required")
    .matches(/^[0-9]{10}$/, "Enter valid 10 digit mobile number"),
  password: Yup.string().required("Password is required"),
});

interface LoginFormValues {
  mobile: string;
  password: string;
}

const LoginPage = () => {
  const router = useRouter();
  const { mutate: loginMutate, isPending } = useUserLogin();

  /* -----------------------------
     Move this above useFormik
  ------------------------------ */
  const handleLogin = useCallback(
    (payload: LoginFormValues) => {
      loginMutate(payload, {
        onSuccess: (data) => {
          if (data?.status) {
            toast.success(data.message || "Logged in successfully");

            if (data.accessToken) {
              localStorage.setItem("accessToken", data.accessToken);
            }

            router.push("/main/events");
          }
        },
        onError: (error) => {
          toast.error(error?.message || "Login failed");
          router.push("/auth/login");
        },
      });
    },
    [loginMutate, router]
  );

  /* -----------------------------
     Now Formik can see handleLogin
  ------------------------------ */
  const formik = useFormik<LoginFormValues>({
    initialValues: {
      mobile: "",
      password: "",
    },
    validationSchema: loginSchema,
    onSubmit: handleLogin, // ⬅ no error now
  });

  const { values, handleChange, handleBlur, handleSubmit, touched, errors } = formik;

  return (
    <div className="from-bgPrimaryDark to-bgPrimary/70 flex min-h-screen items-center justify-center bg-linear-to-br p-2">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="w-full max-w-md rounded-2xl border bg-slate-200 p-6 shadow-xl md:p-10"
      >
        <h2 className="text-bgPrimary mb-6 text-center text-3xl font-extrabold">Login</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Mobile */}
          <div>
            <label className="text-bgPrimary block text-sm font-medium">
              Mobile Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="mobile"
              value={values.mobile}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Enter mobile number"
              className={`mt-1 w-full rounded-lg border bg-gray-50 p-3 ${
                touched.mobile && errors.mobile ? "border-red-500" : "border-gray-300"
              }`}
            />
            <p className="min-h-5 text-xs text-red-500">{touched.mobile && errors.mobile}</p>
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

          {/* Submit */}
          <motion.button
            type="submit"
            disabled={isPending}
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.03 }}
            className="bg-bgPrimary w-full rounded-lg py-3 text-lg font-semibold text-white"
          >
            {isPending ? "Logging in..." : "Login"}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
};

export default LoginPage;
