'use client';

import { useState, useEffect } from 'react';
import { useSendMessage } from '@/queries/message/message';
import { useGetDepartments } from '@/queries/department/department';
import { getUserRole } from '@/utils/helper';
import toast from 'react-hot-toast';
import Modal from '@/components/Model';
import { X } from 'lucide-react';

interface SendMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SendMessageModal({ isOpen, onClose }: SendMessageModalProps) {
  const [recipientType, setRecipientType] = useState<'Admin' | 'Department' | 'Broadcast'>('Department');
  const [selectedDepartments, setSelectedDepartments] = useState<Array<{ id: string; name: string }>>([]);
  const [message, setMessage] = useState('');

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
    }
  }, [isOpen, isAdmin]);

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
        <label className="block text-sm font-semibold text-gray-700 mb-2">Message:</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message here..."
          rows={6}
          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-all"
          maxLength={5000}
        />
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
