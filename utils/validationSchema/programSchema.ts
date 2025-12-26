import * as Yup from "yup";

export const programSchema = Yup.object().shape({
  title: Yup.string()
    .trim()
    .required("Program title is required")
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title must not exceed 100 characters"),

  description: Yup.string().required("Description is required"), // No max limit

  departmentIds: Yup.array()
    .of(Yup.string().required())
    .min(1, "Please select at least one department"),
});
