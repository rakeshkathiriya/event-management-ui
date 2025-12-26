import * as Yup from "yup";

export const departmentSchema = Yup.object({
  name: Yup.string().required("Department name is required"),
  description: Yup.string().optional(),
  users: Yup.array().of(Yup.string().required()).min(1, "Select at least one user"),
});
