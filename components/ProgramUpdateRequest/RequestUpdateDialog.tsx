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

const RequestUpdateDialog: React.FC<RequestUpdateDialogProps> = ({
  programId,
  programTitle,
  currentDescription,
  onClose,
}) => {
  const [requestedDescription, setRequestedDescription] = useState(currentDescription || "");
  const [isListening, setIsListening] = useState(false);
  const [speechLang, setSpeechLang] = useState<'en-US' | 'gu-IN'>('en-US');
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const baseDescriptionRef = useRef<string>('');
  const finalTranscriptRef = useRef<string>('');
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const { mutate: submitRequest, isPending } = useSubmitUpdateRequest();

  // Stop voice recording on keypress or click outside editor
  useEffect(() => {
    if (!isListening) return;

    const stopRecognition = () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        setIsListening(false);
      }
    };

    const handleKeyDown = () => {
      stopRecognition();
    };

    const handleClick = (e: MouseEvent) => {
      if (editorContainerRef.current && !editorContainerRef.current.contains(e.target as Node)) {
        stopRecognition();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('click', handleClick);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('click', handleClick);
    };
  }, [isListening]);

  // Cleanup speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Helper to strip HTML tags and get plain text
  const stripHtml = (html: string) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  const toggleSpeechRecognition = () => {
    if (typeof window !== 'undefined' && !window.isSecureContext) {
      toast.error('Speech recognition requires HTTPS or localhost');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error('Speech recognition is not supported in your browser');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = speechLang;

      baseDescriptionRef.current = requestedDescription;
      finalTranscriptRef.current = '';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = 0; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        finalTranscriptRef.current = finalTranscript;

        const dots = interimTranscript ? '...' : '';
        const fullTranscript = finalTranscript + interimTranscript + dots;

        if (fullTranscript) {
          const plainBase = stripHtml(baseDescriptionRef.current).trim();
          const separator = plainBase ? ' ' : '';
          let newContent = baseDescriptionRef.current;

          if (newContent && newContent !== '<p><br></p>' && newContent.endsWith('</p>')) {
            newContent = newContent.slice(0, -4) + separator + fullTranscript + '</p>';
          } else if (newContent && newContent !== '<p><br></p>') {
            newContent = newContent + separator + fullTranscript;
          } else {
            newContent = `<p>${fullTranscript}</p>`;
          }

          setRequestedDescription(newContent);
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error);
        switch (event.error) {
          case 'not-allowed':
            toast.error('Microphone access denied. Please allow microphone access.');
            break;
          case 'network':
            toast.error('Network error. Speech recognition may be blocked on this network. Try on mobile or a different network.');
            break;
          case 'no-speech':
            toast.error('No speech detected. Please try again.');
            break;
          case 'audio-capture':
            toast.error('No microphone found. Please connect a microphone.');
            break;
          case 'aborted':
            break;
          default:
            toast.error('Speech recognition error. Please try again.');
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    }
  };

  const handleSubmit = () => {
    if (!requestedDescription || requestedDescription.trim() === "") {
      toast.error("Description cannot be empty");
      return;
    }

    if (requestedDescription === currentDescription) {
      toast.error("No changes detected in the description");
      return;
    }

    submitRequest(
      {
        programId,
        requestedDescription,
      },
      {
        onSuccess: () => {
          toast.success("Update request submitted successfully!");
          onClose();
        },
        onError: (error: any) => {
          toast.error(error?.message || "Failed to submit update request");
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-4xl rounded-lg bg-white shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Request Description Update</h2>
            <p className="text-sm text-gray-500 mt-1">Program: {programTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 hover:bg-gray-100 transition"
            disabled={isPending}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Description
            </label>
            <div
            // className="prose prose-sm max-w-none rounded-lg border border-gray-200 bg-gray-50 p-4"
            // dangerouslySetInnerHTML={{
            //   __html: currentDescription || "<p>No description available</p>",
            // }}
            />
          </div> */}

          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Requested Description <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                {/* Language Toggle */}
                <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setSpeechLang('en-US')}
                    disabled={isListening}
                    className={`px-2.5 py-1 text-xs font-medium transition-all ${
                      speechLang === 'en-US'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-100'
                    } ${isListening ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title="English"
                  >
                    EN
                  </button>
                  <button
                    type="button"
                    onClick={() => setSpeechLang('gu-IN')}
                    disabled={isListening}
                    className={`px-2.5 py-1 text-xs font-medium transition-all ${
                      speechLang === 'gu-IN'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-100'
                    } ${isListening ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title="ગુજરાતી (Gujarati)"
                  >
                    ગુજ
                  </button>
                </div>
                {/* Voice Button */}
                <button
                  type="button"
                  onClick={toggleSpeechRecognition}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    isListening
                      ? 'bg-red-100 text-red-600 hover:bg-red-200 animate-pulse'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  title={isListening ? 'Stop listening' : 'Start voice input'}
                >
                  {isListening ? (
                    <>
                      <MicOff size={16} />
                      <span>Stop</span>
                    </>
                  ) : (
                    <>
                      <Mic size={16} />
                      <span>Voice</span>
                    </>
                  )}
                </button>
              </div>
            </div>
            <div
              ref={editorContainerRef}
              className={`quill-wrapper rounded-xl overflow-hidden transition-all ${
                isListening
                  ? 'border-2 border-dashed border-red-400 bg-red-50'
                  : 'border border-solid border-gray-300'
              }`}
            >
              {isListening && (
                <div className="bg-red-50 px-3 py-1.5 text-xs text-red-600 flex items-center gap-2 border-b border-red-200">
                  <span className="flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                  {speechLang === 'gu-IN' ? 'સાંભળી રહ્યું છે... હવે બોલો' : 'Listening... Speak now'}
                </div>
              )}
              <ReactQuill
                theme="snow"
                value={requestedDescription}
                onChange={setRequestedDescription}
                className={isListening ? "bg-red-50" : "bg-white"}
                modules={quillModules}
                formats={quillFormats}
                placeholder="Enter the updated description..."
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              This request will be reviewed by an admin before it becomes live.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
            disabled={isPending}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isPending}
            className="rounded-lg px-5 py-2 text-sm font-medium text-white shadow transition disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: "linear-gradient(135deg, #044241 0%, #2D6F6D 100%)" }}
          >
            {isPending ? "Submitting..." : "Submit Request"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RequestUpdateDialog;
