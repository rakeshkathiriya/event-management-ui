import * as Yup from "yup";

export const eventSchema = Yup.object().shape({
  title: Yup.string()
    .trim()
    .min(3, "Title must be at least 3 characters")
    .required("Event title is required"),

  description: Yup.string()
    .min(5, "Description must be at least 5 characters")
    .required("Description is required"),

  startDate: Yup.date().required("Start date is required").typeError("Please select a valid date"),

  totalDays: Yup.number()
    .required("Total days is required")
    .min(1, "Event must be at least 1 day long")
    .integer("Total days must be a whole number"),
});
