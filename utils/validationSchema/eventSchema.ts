import * as Yup from "yup";

export const eventSchema = Yup.object().shape({
  title: Yup.string()
    .trim()
    .min(3, "Title must be at least 3 characters")
    .required("Event title is required"),

  description: Yup.string()
    .min(5, "Description must be at least 5 characters")
    .required("Description is required"),

  startDate: Yup.date()
    .required("Start date is required")
    .typeError("Please select a valid date"),

  endDate: Yup.date()
    .required("End date is required")
    .typeError("Please select a valid date")
    .min(
      Yup.ref('startDate'),
      "End date must be on or after start date"
    ),
});
