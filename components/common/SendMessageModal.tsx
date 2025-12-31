'use client';

import { useState, useEffect, useRef } from 'react';
import { useSendMessage } from '@/queries/message/message';
import { useGetDepartments } from '@/queries/department/department';
import { getUserRole } from '@/utils/helper';
import toast from 'react-hot-toast';
import Modal from '@/components/Model';
import { X, Mic, MicOff } from 'lucide-react';

interface SendMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SendMessageModal({ isOpen, onClose }: SendMessageModalProps) {
  const [recipientType, setRecipientType] = useState<'Admin' | 'Department' | 'Broadcast'>('Department');
  const [selectedDepartments, setSelectedDepartments] = useState<Array<{ id: string; name: string }>>([]);
  const [message, setMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speechLang, setSpeechLang] = useState<'en-US' | 'gu-IN'>('en-US');
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const baseMessageRef = useRef<string>('');
  const finalTranscriptRef = useRef<string>('');

  const userRole = getUserRole();
  const isAdmin = userRole === 'Admin';
  const { mutate: sendMessage, isPending } = useSendMessage();
  const { data: departmentsData } = useGetDepartments();

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setRecipientType(isAdmin ? 'Broadcast' : 'Department');
      setSelectedDepartments([]);
      setMessage('');
      // Stop speech recognition when modal closes
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        setIsListening(false);
      }
    }
  }, [isOpen, isAdmin]);

  // Cleanup speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleSpeechRecognition = () => {
    // Check if running in secure context (required for speech recognition)
    if (typeof window !== 'undefined' && !window.isSecureContext) {
      toast.error('Speech recognition requires HTTPS or localhost');
      return;
    }

    // Check if browser supports speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error('Speech recognition is not supported in your browser');
      return;
    }

    if (isListening) {
      // Stop listening
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      // Start listening
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = speechLang;

      // Save the current message as base and reset final transcript
      baseMessageRef.current = message;
      finalTranscriptRef.current = '';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = '';
        let interimTranscript = '';

        // Process all results fresh each time to avoid duplication
        for (let i = 0; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        // Store final transcript for reference
        finalTranscriptRef.current = finalTranscript;

        // Build the complete message: base + final + interim (real-time)
        const base = baseMessageRef.current;
        const separator = base && (finalTranscript || interimTranscript) ? ' ' : '';
        // Add "..." when there's interim speech to show user is still speaking
        const dots = interimTranscript ? '...' : '';
        const newMessage = base + separator + finalTranscript + interimTranscript + dots;

        setMessage(newMessage);
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
            // User aborted, no need to show error
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

  const handleAddDepartment = (deptId: string) => {
    const dept = departmentsData?.data?.departments?.find((d) => d._id === deptId);
    if (dept && !selectedDepartments.find((d) => d.id === deptId)) {
      setSelectedDepartments([...selectedDepartments, { id: dept._id, name: dept.name }]);
    }
  };

  const handleRemoveDepartment = (deptId: string) => {
    setSelectedDepartments(selectedDepartments.filter((d) => d.id !== deptId));
  };

  const handleSend = () => {
    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    if (recipientType === 'Department' && selectedDepartments.length === 0) {
      toast.error('Please select at least one department');
      return;
    }

    sendMessage(
      {
        recipientType,
        departmentIds: recipientType === 'Department' ? selectedDepartments.map((d) => d.id) : undefined,
        subject: 'Quick Message',
        content: message.trim(),
      },
      {
        onSuccess: () => {
          toast.success('Message sent successfully!');
          onClose();
        },
        onError: (error: any) => {
          toast.error(error.message || 'Failed to send message');
        },
      }
    );
  };

  if (!isOpen) return null;

  return (
    <Modal onClose={onClose} isLoading={isPending}>
      {/* Title */}
      <h2 className="text-2xl font-bold text-bgPrimaryDark mb-6">Send Message</h2>

      {/* Recipient Selection */}
      <div className="mb-5">
        <label className="block text-sm font-semibold text-gray-700 mb-3">Send To:</label>
        <div className="flex flex-col gap-3">
          {/* Admin Option - Only for Users */}
          {!isAdmin && (
            <label className="flex items-center cursor-pointer group">
              <input
                type="radio"
                name="recipientType"
                value="Admin"
                checked={recipientType === 'Admin'}
                onChange={(e) => setRecipientType(e.target.value as any)}
                className="mr-3 w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-gray-700 group-hover:text-gray-900">Admin</span>
            </label>
          )}

          {/* Department Option */}
          <label className="flex items-center cursor-pointer group">
            <input
              type="radio"
              name="recipientType"
              value="Department"
              checked={recipientType === 'Department'}
              onChange={(e) => setRecipientType(e.target.value as any)}
              className="mr-3 w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-gray-700 group-hover:text-gray-900">Department</span>
          </label>

          {/* Broadcast Option - Only for Admins */}
          {isAdmin && (
            <label className="flex items-center cursor-pointer group">
              <input
                type="radio"
                name="recipientType"
                value="Broadcast"
                checked={recipientType === 'Broadcast'}
                onChange={(e) => setRecipientType(e.target.value as any)}
                className="mr-3 w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-gray-700 group-hover:text-gray-900">All Users</span>
            </label>
          )}
        </div>
      </div>

      {/* Department Multi-Selector */}
      {recipientType === 'Department' && (
        <div className="mb-5">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Select Departments:
          </label>
          <select
            onChange={(e) => {
              if (e.target.value) {
                handleAddDepartment(e.target.value);
                e.target.value = ''; // Reset selector
              }
            }}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          >
            <option value="">-- Add Department --</option>
            {departmentsData?.data?.departments
              ?.filter((dept) => !selectedDepartments.find((d) => d.id === dept._id))
              .map((dept) => (
                <option key={dept._id} value={dept._id}>
                  {dept.name}
                </option>
              ))}
          </select>

          {/* Selected Department Chips */}
          {selectedDepartments.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {selectedDepartments.map((dept) => (
                <div
                  key={dept.id}
                  className="flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1.5 rounded-full text-sm font-medium"
                >
                  <span>{dept.name}</span>
                  <button
                    onClick={() => handleRemoveDepartment(dept.id)}
                    className="hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                    title="Remove"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Message Textarea */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-semibold text-gray-700">Message:</label>
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
        <div className="relative">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={
              isListening
                ? speechLang === 'gu-IN'
                  ? 'સાંભળી રહ્યું છે... હવે બોલો'
                  : 'Listening... Speak now'
                : 'Type your message here...'
            }
            rows={6}
            className={`w-full rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-all ${
              isListening
                ? 'border-2 border-dashed border-red-400 bg-red-50'
                : 'border border-solid border-gray-300'
            }`}
            maxLength={5000}
          />
          {isListening && (
            <div className="absolute top-2 right-2">
              <span className="flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
            </div>
          )}
        </div>
        <p className="text-sm text-gray-500 mt-1.5">{message.length} / 5000 characters</p>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        <button
          onClick={onClose}
          className="px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700"
          disabled={isPending}
        >
          Cancel
        </button>
        <button
          onClick={handleSend}
          disabled={isPending}
          className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium shadow-sm"
        >
          {isPending ? 'Sending...' : 'Send Message'}
        </button>
      </div>
    </Modal>
  );
}
