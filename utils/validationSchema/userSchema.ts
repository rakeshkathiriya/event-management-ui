import * as Yup from "yup";

export const userRegisterSchema = Yup.object({
  name: Yup.string().trim().required("Name is required"),

  mobile: Yup.string()
    .matches(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number")
    .required("Mobile number is required"),

  password: Yup.string()
    .min(8, "Password must be at least 8 characters")
    .max(64, "Password cannot exceed 64 characters")
    .required("Password is required"),
});
