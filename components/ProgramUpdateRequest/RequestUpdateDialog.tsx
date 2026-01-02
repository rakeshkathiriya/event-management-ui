"use client";

import { useSubmitUpdateRequest } from "@/queries/programUpdateRequest/programUpdateRequest";
import { quillFormats, quillModules } from "@/utils/editor/quillConfig";
import { X, Mic, MicOff } from "lucide-react";
import dynamic from "next/dynamic";
import "quill/dist/quill.snow.css";
import { useState, useRef, useEffect } from "react";
import { toast } from "react-hot-toast";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

interface RequestUpdateDialogProps {
  programId: string;
  programTitle: string;
  currentDescription: string;
  onClose: () => void;
}

type QuillInstance = {
  getSelection: (focus?: boolean) => { index: number; length: number } | null;
  insertText: (index: number, text: string, source?: string) => void;
  setSelection: (index: number, length: number) => void;
  getFormat: (index?: number) => any;
};

const RequestUpdateDialog: React.FC<RequestUpdateDialogProps> = ({
  programId,
  programTitle,
  currentDescription,
  onClose,
}) => {
  const [requestedDescription, setRequestedDescription] = useState(
    currentDescription || ""
  );
  const [isListening, setIsListening] = useState(false);
  const [speechLang, setSpeechLang] = useState<"en-US" | "gu-IN">("en-US");

  const quillRef = useRef<any>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isUserStoppingRef = useRef(false);
  const editorContainerRef = useRef<HTMLDivElement>(null);

  const { mutate: submitRequest, isPending } = useSubmitUpdateRequest();

  /* ---------------- Stop recording on key press / outside click ---------------- */
  useEffect(() => {
    if (!isListening) return;

    const stop = () => {
      isUserStoppingRef.current = true;
      recognitionRef.current?.stop();
      setIsListening(false);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
    // Allow Enter to continue speech (new line / bullet)
    if (e.key === "Enter") return;

    // Stop only on Escape
    if (e.key === "Escape") {
      stop();
    }
  };
    const handleClick = (e: MouseEvent) => {
    if (
      editorContainerRef.current &&
      !editorContainerRef.current.contains(e.target as Node)
    ) {
      stop();
    }
  };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("click", handleClick);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("click", handleClick);
    };
  }, [isListening]);

  /* ---------------- Cleanup ---------------- */
  useEffect(() => {
    return () => recognitionRef.current?.stop();
  }, []);

  /* ---------------- Speech Toggle ---------------- */
  const toggleSpeechRecognition = () => {
    if (!window.isSecureContext) {
      toast.error("Speech recognition requires HTTPS or localhost");
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error("Speech recognition not supported in this browser");
      return;
    }

    if (isListening) {
      isUserStoppingRef.current = true;
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = speechLang;
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
      isUserStoppingRef.current = false;
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const quill: QuillInstance | undefined =
        quillRef.current?.getEditor();

      if (!quill) return;

      const selection = quill.getSelection(true);
      if (!selection) return;

      let transcript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          transcript += event.results[i][0].transcript;
        }
      }

      if (!transcript.trim()) return;

      transcript =
        " " +
        transcript.charAt(0).toUpperCase() +
        transcript.slice(1);

      const insertIndex = selection.index;
      quill.insertText(insertIndex, transcript, "user");
      quill.setSelection(insertIndex + transcript.length, 0);
    };

    recognition.onerror = (e) => {
      console.error("Speech error:", e.error);
      toast.error("Speech recognition error");
      setIsListening(false);
    };

    recognition.onend = () => {
      if (!isUserStoppingRef.current) {
        recognition.start(); // auto-restart (Chrome fix)
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  /* ---------------- Submit ---------------- */
  const handleSubmit = () => {
    if (!requestedDescription.trim()) {
      toast.error("Description cannot be empty");
      return;
    }

    if (requestedDescription === currentDescription) {
      toast.error("No changes detected");
      return;
    }

    submitRequest(
      { programId, requestedDescription },
      {
        onSuccess: () => {
          toast.success("Update request submitted");
          onClose();
        },
        onError: (e: any) =>
          toast.error(e?.message || "Submission failed"),
      }
    );
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-4xl rounded-lg bg-white shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-center border-b px-6 py-4">
          <div>
            <h2 className="text-xl font-semibold">Request Description Update</h2>
            <p className="text-sm text-gray-500">Program: {programTitle}</p>
          </div>
          <button onClick={onClose} disabled={isPending}>
            <X />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium">
              Requested Description <span className="text-red-500">*</span>
            </label>

            <div className="flex gap-2">
              <button
                disabled={isListening}
                onClick={() => setSpeechLang("en-US")}
                className={`px-2 py-1 text-xs ${
                  speechLang === "en-US"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100"
                }`}
              >
                EN
              </button>
              <button
                disabled={isListening}
                onClick={() => setSpeechLang("gu-IN")}
                className={`px-2 py-1 text-xs ${
                  speechLang === "gu-IN"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100"
                }`}
              >
                ગુજ
              </button>

              <button
                onClick={toggleSpeechRecognition}
                className={`flex items-center gap-1 px-3 py-1 rounded ${
                  isListening ? "bg-red-200" : "bg-gray-200"
                }`}
              >
                {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                {isListening ? "Stop" : "Voice"}
              </button>
            </div>
          </div>

          <div ref={editorContainerRef}>
            <ReactQuill
              ref={quillRef}
              theme="snow"
              value={requestedDescription}
              onChange={setRequestedDescription}
              modules={quillModules}
              formats={quillFormats}
              placeholder="Enter updated description..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t px-6 py-4">
          <button onClick={onClose} disabled={isPending}>
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isPending}
            className="text-white px-5 py-2 rounded"
            style={{
              background:
                "linear-gradient(135deg, #044241 0%, #2D6F6D 100%)",
            }}
          >
            {isPending ? "Submitting..." : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RequestUpdateDialog;
