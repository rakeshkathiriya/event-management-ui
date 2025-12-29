"use client";

import Modal from "@/components/Model";
import { useCreateEvent } from "@/queries/event/event";
import { eventSchema } from "@/utils/validationSchema/eventSchema";
import { useFormik } from "formik";
import { toast } from "react-toastify";

interface CreateEventFormProps {
  onCancel: () => void;
}

export const CreateEventForm = ({ onCancel }: CreateEventFormProps) => {
  const { mutate, isPending } = useCreateEvent();

  const formik = useFormik({
    initialValues: {
      title: "",
      description: "",
      startDate: "",
      endDate: "",
    },
    validationSchema: eventSchema,
    onSubmit: (values) => {
      mutate(
        {
          title: values.title,
          description: values.description,
          startDate: new Date(values.startDate),
          endDate: new Date(values.endDate),
        },
        {
          onSuccess: () => {
            toast.success("Event created successfully");
            onCancel();
          },
          onError: () => {
            toast.error("Failed to create event");
          },
        }
      );
    },
  });

  const { values, handleChange, handleSubmit, touched, errors } = formik;

  return (
    <Modal onClose={onCancel} isLoading={isPending}>
      <h3 className="mb-6 text-center text-xl font-semibold text-bgPrimaryDark">Create Event</h3>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Event Title */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-bgPrimaryDark">
            Event Title <span className="text-red-500">*</span>
          </label>
          <input
            name="title"
            value={values.title}
            onChange={handleChange}
            className={`w-full rounded-xl px-4 py-3 text-sm ${
              touched.title && errors.title ? "border border-red-500" : "border border-bgPrimary/30"
            }`}
            placeholder="Enter event title"
          />
          <p className="text-xs text-red-500">{touched.title && errors.title}</p>
        </div>

        {/* Description */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-bgPrimaryDark">Description</label>
          <textarea
            name="description"
            rows={2}
            value={values.description}
            onChange={handleChange}
            className="w-full rounded-xl border border-bgPrimary/30 px-4 py-3"
            placeholder="Describe the event..."
          />
          <p className="text-xs text-red-500">{touched.description && errors.description}</p>
        </div>

        {/* Start Date */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-bgPrimaryDark">Start Date</label>
          <input
            type="date"
            name="startDate"
            value={values.startDate}
            onChange={handleChange}
            className="w-full rounded-xl border border-bgPrimary/30 px-4 py-3"
          />
          <p className="text-xs text-red-500">{touched.startDate && errors.startDate}</p>
        </div>

        {/* End Date */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-bgPrimaryDark">
            End Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            name="endDate"
            value={values.endDate}
            onChange={handleChange}
            min={values.startDate}
            className={`w-full rounded-xl px-4 py-3 text-sm ${
              touched.endDate && errors.endDate
                ? "border border-red-500"
                : "border border-bgPrimary/30"
            }`}
          />
          <p className="text-xs text-red-500">{touched.endDate && errors.endDate}</p>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-full bg-bgPrimaryDark py-3 font-semibold text-white transition hover:opacity-90"
        >
          {isPending ? "Creating..." : "Create Event"}
        </button>
      </form>
    </Modal>
  );
};

export default CreateEventForm;
