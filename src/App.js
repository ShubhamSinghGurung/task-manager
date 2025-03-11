import React, {
  useReducer,
  useEffect,
  useContext,
  useState,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { ThemeContext, ThemeProvider } from "./ThemeContext";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { ToastContainer, toast } from "react-toastify";
import { AnimatePresence, motion } from "framer-motion";
import "react-toastify/dist/ReactToastify.css";
import "./styles.css";
import Task from "./Task";

const ACTIONS = {
  ADD_TASK: "add-task",
  DELETE_TASK: "delete-task",
  TOGGLE_COMPLETE: "toggle-complete",
  REORDER_TASKS: "reorder-tasks",
  UNDO: "undo",
  REDO: "redo",
};

// 🔥 Add history stack for undo/redo
const taskHistory = {
  past: [],
  present: [],
  future: [],
};

function taskReducer(state, action) {
  switch (action.type) {
    case ACTIONS.ADD_TASK:
      toast.success("Task added successfully!");
      return {
        ...state,
        past: [...state.past, state.present],
        present: [...state.present, { id: Date.now(), title: action.payload, completed: false }],
        future: [],
      };

    case ACTIONS.DELETE_TASK:
      return {
        ...state,
        past: [...state.past, state.present],
        present: state.present.filter((task) => task.id !== action.payload),
        future: [],
      };

    case ACTIONS.TOGGLE_COMPLETE:
      return {
        ...state,
        past: [...state.past, state.present],
        present: state.present.map((task) =>
          task.id === action.payload ? { ...task, completed: !task.completed } : task
        ),
        future: [],
      };

    case ACTIONS.REORDER_TASKS:
      return {
        ...state,
        past: [...state.past, state.present],
        present: action.payload,
        future: [],
      };

    // ✅ Undo last action
    case ACTIONS.UNDO:
      if (state.past.length === 0) return state;
      const previousState = state.past[state.past.length - 1];
      return {
        past: state.past.slice(0, -1),
        present: previousState,
        future: [state.present, ...state.future],
      };

    // ✅ Redo undone action
    case ACTIONS.REDO:
      if (state.future.length === 0) return state;
      const nextState = state.future[0];
      return {
        past: [...state.past, state.present],
        present: nextState,
        future: state.future.slice(1),
      };

    default:
      return state;
  }
}

function TaskManager() {
  const [state, dispatch] = useReducer(taskReducer, taskHistory);
  const [task, setTask] = useState("");
  const [filter, setFilter] = useState("all");
  const { darkMode, setDarkMode } = useContext(ThemeContext);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current.focus();
  }, []);

  const filteredTasks = useMemo(() => {
    return state.present.filter((task) => {
      if (filter === "completed") return task.completed;
      if (filter === "pending") return !task.completed;
      return true;
    });
  }, [state.present, filter]);

  const addTask = useCallback(() => {
    if (task.trim() === "") {
      toast.warn("Task cannot be empty!");
      return;
    }
    dispatch({ type: ACTIONS.ADD_TASK, payload: task });
    setTask("");
    inputRef.current.focus();
  }, [task]);

  const deleteTask = useCallback((id) => {
    dispatch({ type: ACTIONS.DELETE_TASK, payload: id });
    toast.error("Task deleted!");
  }, []);

  const toggleComplete = useCallback((id) => {
    dispatch({ type: ACTIONS.TOGGLE_COMPLETE, payload: id });
    toast.info("Task status updated!");
  }, []);

  const moveTask = useCallback((fromIndex, toIndex) => {
    const taskToMove = filteredTasks[fromIndex];
    const originalFromIndex = state.present.findIndex((t) => t.id === taskToMove.id);

    const updatedTasks = [...state.present];
    const [movedTask] = updatedTasks.splice(originalFromIndex, 1);
    updatedTasks.splice(toIndex, 0, movedTask);

    dispatch({ type: ACTIONS.REORDER_TASKS, payload: updatedTasks });
  }, [state.present, filteredTasks]);

  const dropTask = useCallback((fromIndex, toIndex) => {
    if (fromIndex === toIndex) return;

    moveTask(fromIndex, toIndex);

    setTimeout(() => {
      toast.success("Tasks reordered!");
    }, 200);
  }, [moveTask]);

  // ✅ Undo Last Action
  const undo = () => {
    dispatch({ type: ACTIONS.UNDO });
    toast.info("Undo last action.");
  };

  // ✅ Redo Last Action
  const redo = () => {
    dispatch({ type: ACTIONS.REDO });
    toast.info("Redo last action.");
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <>
        <div className={`container ${darkMode ? "dark-mode" : ""}`}>
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Task Manager
          </motion.h1>

          <motion.button
            onClick={() => setDarkMode((prev) => !prev)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            Toggle {darkMode ? "Light" : "Dark"} Mode
          </motion.button>

          <motion.input
            ref={inputRef}
            type="text"
            value={task}
            onChange={(e) => setTask(e.target.value)}
            placeholder="Enter a task"
            whileFocus={{ scale: 1.05 }}
          />
          <motion.button className="add-task" onClick={addTask} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            Add Task
          </motion.button>

          <div>
            <motion.button className="filter-btn" onClick={() => setFilter("all")} whileHover={{ scale: 1.1 }}>
              All
            </motion.button>
            <motion.button className="filter-btn completed" onClick={() => setFilter("completed")} whileHover={{ scale: 1.1 }}>
              Completed
            </motion.button>
            <motion.button className="filter-btn pending" onClick={() => setFilter("pending")} whileHover={{ scale: 1.1 }}>
              Pending
            </motion.button>
          </div>

          {/* ✅ Undo & Redo Buttons */}
          <div>
            <motion.button onClick={undo} whileHover={{ scale: 1.1 }} disabled={state.past.length === 0}>
              ⬅ Undo
            </motion.button>
            <motion.button onClick={redo} whileHover={{ scale: 1.1 }} disabled={state.future.length === 0}>
              ➡ Redo
            </motion.button>
          </div>

          <motion.ul layout>
            <AnimatePresence>
              {filteredTasks.map((t, index) => (
                <Task
                  key={t.id}
                  task={t}
                  index={index}
                  moveTask={moveTask}
                  dropTask={dropTask}
                  toggleComplete={toggleComplete}
                  deleteTask={deleteTask}
                />
              ))}
            </AnimatePresence>
          </motion.ul>
        </div>

        <ToastContainer position="top-right" autoClose={2000} />
      </>
    </DndProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <TaskManager />
    </ThemeProvider>
  );
}
