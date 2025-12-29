"use client";

import Modal from "@/components/Model";
import { useAddProgramToDay } from "@/queries/day/day";
import { useGetPrograms } from "@/queries/program/program";
import { useFormik } from "formik";
import { X } from "lucide-react";
import { toast } from "react-toastify";

/* ---------------- Types ---------------- */

interface Program {
  _id: string;
  title: string;
}

interface AddProgramFormValues {
  programIds: string[];
}

interface AddProgramInDayProps {
  dayId: string;
  onClose: () => void;
  refetchData?: () => void;
}

/* ---------------- Component ---------------- */

const AddProgramInDay = ({ dayId, onClose, refetchData }: AddProgramInDayProps) => {
  const { mutate, isPending } = useAddProgramToDay();
  const { data, isLoading } = useGetPrograms();

  // ✅ SAFELY extract array - data already contains { programs: [], total: number }
  const programs: Program[] = data?.programs ?? [];

  const formik = useFormik<AddProgramFormValues>({
    initialValues: {
      programIds: [],
    },

    onSubmit: (values, { resetForm }) => {
      // ✅ FINAL SAFETY CHECK
      if (!Array.isArray(values.programIds) || values.programIds.length === 0) {
        toast.error("Please select at least one program");
        return;
      }

      mutate(
        {
          dayId,
          payload: {
            programIds: values.programIds, // ✅ ALWAYS CORRECT
          },
        },
        {
          onSuccess: (res) => {
            toast.success(res.message || "Program added to day");
            refetchData?.();
            resetForm();
            onClose();
          },
          onError: (err) => {
            toast.error(err.message || "Failed to add program");
          },
        }
      );
    },
  });

  const { values, setFieldValue, handleSubmit } = formik;

  return (
    <Modal onClose={onClose} isLoading={isPending}>
      <h3 className="mb-6 text-center text-xl font-semibold text-bgPrimaryDark">
        Add Program to Day
      </h3>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Program Selector */}
        <div>
          <label className="text-sm font-medium text-bgPrimaryDark">
            Select Program <span className="text-red-500">*</span>
          </label>

          {isLoading ? (
            <p className="mt-2 text-sm text-gray-400">Loading programs…</p>
          ) : (
            <select
              className="mt-2 w-full rounded-xl border border-bgPrimary/30 px-4 py-3 text-sm"
              onChange={(e) => {
                const id = e.target.value;
                if (!id) return;

                // ✅ FORMik-SAFE UPDATE (NO RACE)
                setFieldValue("programIds", (prev: string[]) =>
                  prev.includes(id) ? prev : [...prev, id]
                );

                e.target.value = "";
              }}
            >
              <option value="">Select program</option>
              {programs.map((program) => (
                <option key={program._id} value={program._id}>
                  {program.title}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Selected Programs (Chips) */}
        {values.programIds.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {values.programIds.map((id) => {
              const program = programs.find((p) => p._id === id);
              if (!program) return null;

              return (
                <span
                  key={id}
                  className="flex items-center gap-2 rounded-full bg-bgPrimary/20 px-3 py-1 text-sm text-bgPrimaryDark"
                >
                  {program.title}
                  <button
                    type="button"
                    onClick={() =>
                      setFieldValue("programIds", (prev: string[]) => prev.filter((p) => p !== id))
                    }
                    className="flex h-5 w-5 items-center justify-center rounded-full bg-bgPrimaryDark/40 text-bgPrimaryDark transition hover:bg-bgPrimaryDark hover:text-white"
                  >
                    <X className="size-4" />
                  </button>
                </span>
              );
            })}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="rounded-xl border px-4 py-2 text-sm disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isPending || values.programIds.length === 0}
            className="rounded-full bg-bgPrimaryDark px-6 py-2 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed"
          >
            {isPending ? "Adding..." : "Add Program"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddProgramInDay;
