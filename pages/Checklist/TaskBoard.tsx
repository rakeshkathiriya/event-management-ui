"use client";

import { useAuth } from "@/hooks/useAuth";
import { useTaskSync } from "@/hooks/useTaskSync";
import {
  useGetTaskBoard,
  useMoveTask,
  useReorderTasksInColumn,
  useSeedTaskStatuses,
} from "@/queries/task/task";
import { Task, TaskColumn, TaskFilters, TaskPriority } from "@/utils/types/task";
import {
  closestCorners,
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Calendar,
  CheckCircle2,
  ChevronDown,
  Filter,
  GripVertical,
  MoreHorizontal,
  Plus,
  Search,
  User,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import TaskFormModal from "./TaskFormModal";
import TaskFiltersPanel from "./TaskFiltersPanel";

// Priority colors
const priorityColors: Record<TaskPriority, string> = {
  low: "bg-gray-100 text-gray-600",
  medium: "bg-blue-100 text-blue-600",
  high: "bg-orange-100 text-orange-600",
  urgent: "bg-red-100 text-red-600",
};

const priorityLabels: Record<TaskPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

// Sortable Task Card
interface SortableTaskCardProps {
  task: Task;
  onClick: () => void;
}

function SortableTaskCard({ task, onClick }: SortableTaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task._id,
    data: { type: "task", task },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group bg-white rounded-lg border border-gray-200 p-3 hover:shadow-md transition-all cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start gap-2">
        <div
          {...attributes}
          {...listeners}
          className="mt-1 cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="w-3 h-3 text-gray-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-gray-900 truncate">
            {task.title}
          </h4>
          {task.description && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
              {task.description.replace(/<[^>]*>/g, "").substring(0, 80)}
            </p>
          )}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                priorityColors[task.priority]
              }`}
            >
              {priorityLabels[task.priority]}
            </span>
            {task.assignee && (
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <User className="w-3 h-3" />
                {task.assignee.name}
              </span>
            )}
            {task.dueDate && (
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(task.dueDate).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Task Card Overlay (shown during drag)
function TaskCardOverlay({ task }: { task: Task }) {
  return (
    <div className="bg-white rounded-lg border-2 border-bgPrimary p-3 shadow-xl">
      <h4 className="text-sm font-medium text-gray-900">{task.title}</h4>
      <div className="flex items-center gap-2 mt-2">
        <span
          className={`text-xs px-2 py-0.5 rounded-full ${
            priorityColors[task.priority]
          }`}
        >
          {priorityLabels[task.priority]}
        </span>
      </div>
    </div>
  );
}

// Column Component
interface TaskColumnComponentProps {
  column: TaskColumn;
  onTaskClick: (task: Task) => void;
  onAddTask: (statusId: string) => void;
  filteredTasks: Task[];
}

function TaskColumnComponent({
  column,
  onTaskClick,
  onAddTask,
  filteredTasks,
}: TaskColumnComponentProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex flex-col bg-gray-50 rounded-xl min-w-[300px] max-w-[300px] h-fit max-h-[calc(100vh-220px)]">
      {/* Column Header */}
      <div
        className="flex items-center justify-between p-3 cursor-pointer"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: column.status.color }}
          />
          <h3 className="font-medium text-gray-800">{column.status.name}</h3>
          <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
            {filteredTasks.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddTask(column.status._id);
            }}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
          >
            <Plus className="w-4 h-4 text-gray-500" />
          </button>
          <ChevronDown
            className={`w-4 h-4 text-gray-500 transition-transform ${
              isCollapsed ? "-rotate-90" : ""
            }`}
          />
        </div>
      </div>

      {/* Column Content */}
      {!isCollapsed && (
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          <SortableContext
            items={filteredTasks.map((t) => t._id)}
            strategy={verticalListSortingStrategy}
          >
            {filteredTasks.map((task) => (
              <SortableTaskCard
                key={task._id}
                task={task}
                onClick={() => onTaskClick(task)}
              />
            ))}
          </SortableContext>
          {filteredTasks.length === 0 && (
            <div className="text-center py-8 text-gray-400 text-sm">
              No tasks
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Main TaskBoard Component
export default function TaskBoard() {
  const { isAdmin } = useAuth();
  const { data: columns, isLoading, refetch } = useGetTaskBoard();
  const moveTaskMutation = useMoveTask();
  const reorderMutation = useReorderTasksInColumn();
  const seedMutation = useSeedTaskStatuses();

  // Real-time sync for task updates
  useTaskSync();

  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [formStatusId, setFormStatusId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<TaskFilters>({});
  const [localColumns, setLocalColumns] = useState<TaskColumn[]>([]);

  // Sync local columns with server data
  useEffect(() => {
    if (columns) {
      setLocalColumns(columns);
    }
  }, [columns]);

  // Seed default statuses if none exist
  useEffect(() => {
    if (columns && columns.length === 0) {
      seedMutation.mutate();
    }
  }, [columns]);

  // Configure drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Filter tasks based on active filters
  const getFilteredTasks = (tasks: Task[]) => {
    return tasks.filter((task) => {
      if (filters.assigneeId && task.assignee?._id !== filters.assigneeId) {
        return false;
      }
      if (filters.departmentId && task.department?._id !== filters.departmentId) {
        return false;
      }
      if (filters.priority && task.priority !== filters.priority) {
        return false;
      }
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        return (
          task.title.toLowerCase().includes(searchLower) ||
          task.description?.toLowerCase().includes(searchLower)
        );
      }
      return true;
    });
  };

  // Find task and column by task ID
  const findTaskAndColumn = (taskId: string) => {
    for (const column of localColumns) {
      const task = column.tasks.find((t) => t._id === taskId);
      if (task) {
        return { task, column };
      }
    }
    return null;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const result = findTaskAndColumn(active.id as string);
    if (result) {
      setActiveTask(result.task);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeResult = findTaskAndColumn(activeId);
    if (!activeResult) return;

    // Check if we're over a column or a task
    const overColumn = localColumns.find((col) => col.status._id === overId);
    const overResult = findTaskAndColumn(overId);

    const targetColumn = overColumn || overResult?.column;
    if (!targetColumn || targetColumn.status._id === activeResult.column.status._id) {
      return;
    }

    // Move task to new column optimistically
    setLocalColumns((prev) => {
      const newColumns = prev.map((col) => ({
        ...col,
        tasks: [...col.tasks],
      }));

      const sourceColIndex = newColumns.findIndex(
        (col) => col.status._id === activeResult.column.status._id
      );
      const destColIndex = newColumns.findIndex(
        (col) => col.status._id === targetColumn.status._id
      );

      const [movedTask] = newColumns[sourceColIndex].tasks.splice(
        newColumns[sourceColIndex].tasks.findIndex((t) => t._id === activeId),
        1
      );

      if (overResult) {
        const overIndex = newColumns[destColIndex].tasks.findIndex(
          (t) => t._id === overId
        );
        newColumns[destColIndex].tasks.splice(overIndex, 0, movedTask);
      } else {
        newColumns[destColIndex].tasks.push(movedTask);
      }

      return newColumns;
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) {
      refetch();
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    const activeResult = findTaskAndColumn(activeId);
    if (!activeResult) {
      refetch();
      return;
    }

    // Check if dropped on a column or task
    const overColumn = localColumns.find((col) => col.status._id === overId);
    const overResult = findTaskAndColumn(overId);
    const targetColumn = overColumn || overResult?.column;

    if (!targetColumn) {
      refetch();
      return;
    }

    const sourceStatusId = activeResult.column.status._id;
    const targetStatusId = targetColumn.status._id;

    if (sourceStatusId === targetStatusId) {
      // Reorder within same column
      const column = localColumns.find((c) => c.status._id === sourceStatusId);
      if (column) {
        const oldIndex = column.tasks.findIndex((t) => t._id === activeId);
        const newIndex = column.tasks.findIndex((t) => t._id === overId);

        if (oldIndex !== newIndex) {
          const reorderedTasks = arrayMove(column.tasks, oldIndex, newIndex);
          setLocalColumns((prev) =>
            prev.map((col) =>
              col.status._id === sourceStatusId
                ? { ...col, tasks: reorderedTasks }
                : col
            )
          );

          reorderMutation.mutate({
            statusId: sourceStatusId,
            taskIds: reorderedTasks.map((t) => t._id),
          });
        }
      }
    } else {
      // Move to different column
      const targetIndex = overResult
        ? targetColumn.tasks.findIndex((t) => t._id === overId)
        : targetColumn.tasks.length;

      moveTaskMutation.mutate(
        {
          id: activeId,
          targetStatusId,
          newOrder: targetIndex,
        },
        {
          onError: () => refetch(),
        }
      );
    }
  };

  const handleAddTask = (statusId: string) => {
    setFormStatusId(statusId);
    setSelectedTask(null);
    setShowTaskForm(true);
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setFormStatusId(task.status._id);
    setShowTaskForm(true);
  };

  const handleCloseForm = () => {
    setShowTaskForm(false);
    setSelectedTask(null);
    setFormStatusId(null);
  };

  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading tasks...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold text-gray-800">Task Board</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={filters.search || ""}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, search: e.target.value }))
              }
              className="pl-9 pr-4 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-bgPrimary/50 w-64"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-colors ${
              showFilters || activeFiltersCount > 0
                ? "bg-bgPrimary text-white border-bgPrimary"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
            {activeFiltersCount > 0 && (
              <span className="bg-white text-bgPrimary text-xs px-1.5 py-0.5 rounded-full">
                {activeFiltersCount}
              </span>
            )}
          </button>
          <button
            onClick={() => handleAddTask(localColumns[0]?.status._id || "")}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-bgPrimary text-white rounded-lg hover:bg-bgPrimaryDark transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Task
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <TaskFiltersPanel
          filters={filters}
          onFiltersChange={setFilters}
          onClose={() => setShowFilters(false)}
        />
      )}

      {/* Board */}
      <div className="flex-1 overflow-x-auto p-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 h-full">
            {localColumns.map((column) => (
              <TaskColumnComponent
                key={column.status._id}
                column={column}
                filteredTasks={getFilteredTasks(column.tasks)}
                onTaskClick={handleTaskClick}
                onAddTask={handleAddTask}
              />
            ))}
          </div>

          <DragOverlay>
            {activeTask && <TaskCardOverlay task={activeTask} />}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Task Form Modal */}
      {showTaskForm && (
        <TaskFormModal
          task={selectedTask}
          statusId={formStatusId || ""}
          onClose={handleCloseForm}
          onSuccess={() => {
            handleCloseForm();
            refetch();
          }}
        />
      )}
    </div>
  );
}
