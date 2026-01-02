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
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  pointerWithin,
  rectIntersection,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useDroppable } from "@dnd-kit/core";
import {
  Calendar,
  ChevronDown,
  Clock,
  Filter,
  GripVertical,
  LayoutGrid,
  Loader2,
  MoreHorizontal,
  Plus,
  Search,
  Sparkles,
  User,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import TaskFormModal from "./TaskFormModal";
import TaskFiltersPanel from "./TaskFiltersPanel";

// Priority configuration with theme colors
const priorityConfig: Record<TaskPriority, { bg: string; text: string; dot: string; label: string }> = {
  low: {
    bg: "bg-slate-50",
    text: "text-slate-600",
    dot: "bg-slate-400",
    label: "Low"
  },
  medium: {
    bg: "bg-bgPrimary/10",
    text: "text-bgPrimary",
    dot: "bg-bgPrimary",
    label: "Medium"
  },
  high: {
    bg: "bg-orange/10",
    text: "text-orange",
    dot: "bg-orange",
    label: "High"
  },
  urgent: {
    bg: "bg-red-50",
    text: "text-red-600",
    dot: "bg-red-500",
    label: "Urgent"
  },
};

// Get initials from name
const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

// Format due date
const formatDueDate = (date: string) => {
  const d = new Date(date);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === tomorrow.toDateString()) return "Tomorrow";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

// Check if due date is overdue
const isOverdue = (date: string) => {
  return new Date(date) < new Date();
};

// Sortable Task Card - Modern Design
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
    data: { type: "task", task, statusId: task.status._id },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const priority = priorityConfig[task.priority];
  const dueDateOverdue = task.dueDate && isOverdue(task.dueDate);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative bg-white rounded-xl border border-borderLight p-4
        hover:border-bgPrimary/30 hover:shadow-[0_4px_20px_rgba(45,111,109,0.08)]
        transition-all duration-200 cursor-pointer
        ${isDragging ? "shadow-xl ring-2 ring-bgPrimary/50 scale-[1.02]" : ""}`}
      onClick={onClick}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute left-1 top-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing
          p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-bgSoft transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="w-4 h-4 text-textMuted" />
      </div>

      <div className="pl-5">
        {/* Title */}
        <h4 className="text-sm font-semibold text-grayDark leading-snug pr-6">
          {task.title}
        </h4>

        {/* Description */}
        {task.description && (
          <p className="text-xs text-textMuted mt-1.5 line-clamp-2 leading-relaxed">
            {task.description.replace(/<[^>]*>/g, "").substring(0, 100)}
          </p>
        )}

        {/* Meta Row */}
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          {/* Priority Badge */}
          <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-md ${priority.bg} ${priority.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${priority.dot}`} />
            {priority.label}
          </span>

          {/* Due Date */}
          {task.dueDate && (
            <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md
              ${dueDateOverdue
                ? "bg-red-50 text-red-600"
                : "bg-bgSoft text-textMuted"}`}
            >
              <Clock className="w-3 h-3" />
              {formatDueDate(task.dueDate)}
            </span>
          )}
        </div>

        {/* Assignee */}
        {task.assignee && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-borderLight/50">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-bgPrimary to-bgPrimaryDark
              flex items-center justify-center text-white text-[10px] font-semibold shadow-sm">
              {getInitials(task.assignee.name)}
            </div>
            <span className="text-xs text-textSecondary font-medium">
              {task.assignee.name}
            </span>
          </div>
        )}
      </div>

      {/* Hover Action */}
      <button
        className="absolute top-3 right-3 p-1.5 rounded-lg opacity-0 group-hover:opacity-100
          hover:bg-bgSoft transition-all"
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
      >
        <MoreHorizontal className="w-4 h-4 text-textMuted" />
      </button>
    </div>
  );
}

// Task Card Overlay - Drag Preview
function TaskCardOverlay({ task }: { task: Task }) {
  const priority = priorityConfig[task.priority];

  return (
    <div className="bg-white rounded-xl border-2 border-bgPrimary p-4 shadow-2xl w-[300px] rotate-2">
      <h4 className="text-sm font-semibold text-grayDark">{task.title}</h4>
      <div className="flex items-center gap-2 mt-2">
        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-md ${priority.bg} ${priority.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${priority.dot}`} />
          {priority.label}
        </span>
        {task.assignee && (
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-bgPrimary to-bgPrimaryDark
            flex items-center justify-center text-white text-[9px] font-semibold">
            {getInitials(task.assignee.name)}
          </div>
        )}
      </div>
    </div>
  );
}

// Droppable Column Component - Modern Design
interface DroppableColumnProps {
  column: TaskColumn;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onAddTask: (statusId: string) => void;
  isOver: boolean;
}

function DroppableColumn({
  column,
  tasks,
  onTaskClick,
  onAddTask,
  isOver,
}: DroppableColumnProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const { setNodeRef } = useDroppable({
    id: `column-${column.status._id}`,
    data: { type: "column", statusId: column.status._id },
  });

  return (
    <div
      className={`flex flex-col rounded-2xl min-w-[320px] max-w-[320px]
        transition-all duration-300 h-fit max-h-[calc(100vh-200px)]
        ${isOver
          ? "bg-bgPrimary/5 ring-2 ring-bgPrimary/30 ring-offset-2"
          : "bg-gradient-to-b from-bgSoft/80 to-bgSoft/40"}`}
    >
      {/* Column Header */}
      <div className="sticky top-0 z-10 backdrop-blur-sm bg-white/80 rounded-t-2xl">
        <div
          className="flex items-center justify-between p-4 cursor-pointer"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-3 h-3 rounded-full ring-4 ring-white shadow-sm"
              style={{ backgroundColor: column.status.color }}
            />
            <h3 className="font-semibold text-grayDark">{column.status.name}</h3>
            <span className="text-xs font-medium text-textMuted bg-white px-2.5 py-1 rounded-full shadow-sm border border-borderLight/50">
              {tasks.length}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddTask(column.status._id);
              }}
              className="p-2 rounded-xl hover:bg-bgPrimary/10 text-textMuted hover:text-bgPrimary transition-all"
              title="Add task"
            >
              <Plus className="w-4 h-4" />
            </button>
            <ChevronDown
              className={`w-4 h-4 text-textMuted transition-transform duration-200 ${
                isCollapsed ? "-rotate-90" : ""
              }`}
            />
          </div>
        </div>
      </div>

      {/* Column Content */}
      {!isCollapsed && (
        <div
          ref={setNodeRef}
          className={`flex-1 overflow-y-auto p-3 space-y-3 min-h-[120px] transition-colors duration-200
            ${isOver ? "bg-bgPrimary/5" : ""}`}
        >
          <SortableContext
            items={tasks.map((t) => t._id)}
            strategy={verticalListSortingStrategy}
          >
            {tasks.map((task) => (
              <SortableTaskCard
                key={task._id}
                task={task}
                onClick={() => onTaskClick(task)}
              />
            ))}
          </SortableContext>

          {/* Empty State */}
          {tasks.length === 0 && (
            <div
              className={`flex flex-col items-center justify-center py-10 rounded-xl border-2 border-dashed transition-all
                ${isOver
                  ? "border-bgPrimary bg-bgPrimary/10 text-bgPrimary"
                  : "border-borderLight text-textMuted"}`}
            >
              {isOver ? (
                <>
                  <div className="w-10 h-10 rounded-full bg-bgPrimary/20 flex items-center justify-center mb-2">
                    <Plus className="w-5 h-5 text-bgPrimary" />
                  </div>
                  <span className="text-sm font-medium">Drop here</span>
                </>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-full bg-bgSoft flex items-center justify-center mb-2">
                    <LayoutGrid className="w-5 h-5 text-textMuted" />
                  </div>
                  <span className="text-sm">No tasks yet</span>
                  <button
                    onClick={() => onAddTask(column.status._id)}
                    className="mt-2 text-xs text-bgPrimary hover:underline font-medium"
                  >
                    + Add a task
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Loading Skeleton
function LoadingSkeleton() {
  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-bgSoft/50 to-white">
      {/* Header Skeleton */}
      <div className="p-6 border-b border-borderLight bg-white/80 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-8 w-32 bg-bgSoft rounded-lg animate-pulse" />
            <div className="h-10 w-64 bg-bgSoft rounded-xl animate-pulse" />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-24 bg-bgSoft rounded-xl animate-pulse" />
            <div className="h-10 w-28 bg-bgSoft rounded-xl animate-pulse" />
          </div>
        </div>
      </div>

      {/* Board Skeleton */}
      <div className="flex-1 p-6">
        <div className="flex gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="w-[320px] space-y-4">
              <div className="h-14 bg-bgSoft rounded-2xl animate-pulse" />
              <div className="space-y-3">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="h-28 bg-white rounded-xl animate-pulse border border-borderLight" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
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
  const [activeColumnId, setActiveColumnId] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [formStatusId, setFormStatusId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<TaskFilters>({});
  const [localColumns, setLocalColumns] = useState<TaskColumn[]>([]);
  const [overColumnId, setOverColumnId] = useState<string | null>(null);

  const dragStartColumnRef = useRef<string | null>(null);

  useEffect(() => {
    if (columns) {
      setLocalColumns(columns);
    }
  }, [columns]);

  useEffect(() => {
    if (columns && columns.length === 0) {
      seedMutation.mutate();
    }
  }, [columns]);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const getFilteredTasks = useCallback(
    (tasks: Task[]) => {
      return tasks.filter((task) => {
        if (filters.assigneeId && task.assignee?._id !== filters.assigneeId) return false;
        if (filters.departmentId && task.department?._id !== filters.departmentId) return false;
        if (filters.priority && task.priority !== filters.priority) return false;
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          return (
            task.title.toLowerCase().includes(searchLower) ||
            task.description?.toLowerCase().includes(searchLower)
          );
        }
        return true;
      });
    },
    [filters]
  );

  const findColumnByTaskId = useCallback(
    (taskId: string): TaskColumn | null => {
      for (const column of localColumns) {
        if (column.tasks.some((t) => t._id === taskId)) {
          return column;
        }
      }
      return null;
    },
    [localColumns]
  );

  const getColumnByStatusId = useCallback(
    (statusId: string): TaskColumn | null => {
      return localColumns.find((col) => col.status._id === statusId) || null;
    },
    [localColumns]
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const taskId = active.id as string;
    const column = findColumnByTaskId(taskId);

    if (column) {
      const task = column.tasks.find((t) => t._id === taskId);
      if (task) {
        setActiveTask(task);
        setActiveColumnId(column.status._id);
        dragStartColumnRef.current = column.status._id;
      }
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || !activeTask) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    let targetColumnId: string | null = null;

    if (overId.startsWith("column-")) {
      targetColumnId = overId.replace("column-", "");
    } else {
      const overColumn = findColumnByTaskId(overId);
      if (overColumn) {
        targetColumnId = overColumn.status._id;
      }
    }

    if (!targetColumnId) return;

    setOverColumnId(targetColumnId);

    const currentColumn = findColumnByTaskId(activeId);
    if (!currentColumn) return;

    const sourceColumnId = currentColumn.status._id;

    if (sourceColumnId !== targetColumnId) {
      setLocalColumns((prev) => {
        const newColumns = prev.map((col) => ({
          ...col,
          tasks: col.tasks.filter((t) => t._id !== activeId),
        }));

        const destColIndex = newColumns.findIndex(
          (col) => col.status._id === targetColumnId
        );

        if (destColIndex === -1) return prev;

        const updatedTask = {
          ...activeTask,
          status: newColumns[destColIndex].status,
        };

        if (overId.startsWith("column-")) {
          newColumns[destColIndex].tasks.push(updatedTask);
        } else {
          const overIndex = newColumns[destColIndex].tasks.findIndex(
            (t) => t._id === overId
          );
          if (overIndex >= 0) {
            newColumns[destColIndex].tasks.splice(overIndex, 0, updatedTask);
          } else {
            newColumns[destColIndex].tasks.push(updatedTask);
          }
        }

        return newColumns;
      });
    } else {
      if (!overId.startsWith("column-") && activeId !== overId) {
        setLocalColumns((prev) => {
          const columnIndex = prev.findIndex(
            (col) => col.status._id === sourceColumnId
          );
          if (columnIndex === -1) return prev;

          const column = prev[columnIndex];
          const oldIndex = column.tasks.findIndex((t) => t._id === activeId);
          const newIndex = column.tasks.findIndex((t) => t._id === overId);

          if (oldIndex === -1 || newIndex === -1) return prev;

          const newTasks = arrayMove(column.tasks, oldIndex, newIndex);

          const newColumns = [...prev];
          newColumns[columnIndex] = { ...column, tasks: newTasks };
          return newColumns;
        });
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveTask(null);
    setActiveColumnId(null);
    setOverColumnId(null);

    if (!over) {
      refetch();
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;
    const originalColumnId = dragStartColumnRef.current;
    dragStartColumnRef.current = null;

    if (!originalColumnId) {
      refetch();
      return;
    }

    let targetColumnId: string | null = null;

    if (overId.startsWith("column-")) {
      targetColumnId = overId.replace("column-", "");
    } else {
      const overColumn = findColumnByTaskId(overId);
      if (overColumn) {
        targetColumnId = overColumn.status._id;
      }
    }

    if (!targetColumnId) {
      refetch();
      return;
    }

    const targetColumn = getColumnByStatusId(targetColumnId);
    if (!targetColumn) {
      refetch();
      return;
    }

    const taskIndex = targetColumn.tasks.findIndex((t) => t._id === activeId);
    const newOrder = taskIndex >= 0 ? taskIndex : targetColumn.tasks.length;

    if (originalColumnId !== targetColumnId) {
      moveTaskMutation.mutate(
        {
          id: activeId,
          targetStatusId: targetColumnId,
          newOrder,
        },
        {
          onError: () => refetch(),
        }
      );
    } else {
      const taskIds = targetColumn.tasks.map((t) => t._id);
      reorderMutation.mutate(
        {
          statusId: targetColumnId,
          taskIds,
        },
        {
          onError: () => refetch(),
        }
      );
    }
  };

  const handleDragCancel = () => {
    setActiveTask(null);
    setActiveColumnId(null);
    setOverColumnId(null);
    dragStartColumnRef.current = null;
    refetch();
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

  const collisionDetection = useCallback((args: any) => {
    const pointerCollisions = pointerWithin(args);
    if (pointerCollisions.length > 0) {
      return pointerCollisions;
    }
    return rectIntersection(args);
  }, []);

  // Total tasks count
  const totalTasks = localColumns.reduce((acc, col) => acc + col.tasks.length, 0);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-bgSoft/30 via-white to-bgPrimary/5">
      {/* Modern Header */}
      <div className="sticky top-0 z-20 backdrop-blur-xl bg-white/90 border-b border-borderLight/50">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left Section */}
            <div className="flex items-center gap-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-bgPrimary to-bgPrimaryDark
                  flex items-center justify-center shadow-lg shadow-bgPrimary/20">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-grayDark">Task Board</h1>
                  <p className="text-xs text-textMuted">{totalTasks} tasks across {localColumns.length} columns</p>
                </div>
              </div>

              {/* Search */}
              <div className="relative ml-4">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-textMuted" />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={filters.search || ""}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, search: e.target.value }))
                  }
                  className="pl-10 pr-4 py-2.5 text-sm bg-bgSoft/50 border border-borderLight rounded-xl
                    focus:outline-none focus:ring-2 focus:ring-bgPrimary/20 focus:border-bgPrimary/50
                    w-72 transition-all placeholder:text-textMuted"
                />
                {filters.search && (
                  <button
                    onClick={() => setFilters((prev) => ({ ...prev, search: "" }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-white rounded-full"
                  >
                    <X className="w-3 h-3 text-textMuted" />
                  </button>
                )}
              </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-3">
              {/* Filter Button */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl
                  border transition-all duration-200
                  ${showFilters || activeFiltersCount > 0
                    ? "bg-bgPrimary text-white border-bgPrimary shadow-lg shadow-bgPrimary/20"
                    : "bg-white text-textSecondary border-borderLight hover:border-bgPrimary/30 hover:shadow-md"
                  }`}
              >
                <Filter className="w-4 h-4" />
                Filters
                {activeFiltersCount > 0 && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold
                    ${showFilters ? "bg-white/20 text-white" : "bg-bgPrimary text-white"}`}>
                    {activeFiltersCount}
                  </span>
                )}
              </button>

              {/* Add Task Button */}
              <button
                onClick={() => handleAddTask(localColumns[0]?.status._id || "")}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold
                  bg-gradient-to-r from-bgPrimary to-bgPrimaryDark text-white rounded-xl
                  hover:shadow-lg hover:shadow-bgPrimary/30 hover:scale-[1.02]
                  transition-all duration-200"
              >
                <Plus className="w-4 h-4" />
                Add Task
              </button>
            </div>
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
      </div>

      {/* Board */}
      <div className="flex-1 overflow-x-auto p-6">
        <DndContext
          sensors={sensors}
          collisionDetection={collisionDetection}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <div className="flex gap-5 h-full pb-4">
            {localColumns.map((column) => (
              <DroppableColumn
                key={column.status._id}
                column={column}
                tasks={getFilteredTasks(column.tasks)}
                onTaskClick={handleTaskClick}
                onAddTask={handleAddTask}
                isOver={overColumnId === column.status._id}
              />
            ))}
          </div>

          <DragOverlay dropAnimation={null}>
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
