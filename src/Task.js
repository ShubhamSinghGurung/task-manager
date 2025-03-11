import React from "react";
import { useDrag, useDrop } from "react-dnd";
import { motion } from "framer-motion";
import { toast } from "react-toastify";

function Task({ task, index, moveTask, dropTask, toggleComplete, deleteTask }) {
  const ref = React.useRef(null);

  const [{ isDragging }, drag] = useDrag({
    type: "TASK",
    item: () => {
      toast.info("Dragging task..."); // ✅ Always show dragging alert
      return { id: task.id, index };
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    end: (item, monitor) => {
      if (!monitor.didDrop()) return;
      dropTask(item.index, index);
    },
  });

  const [, drop] = useDrop({
    accept: "TASK",
    hover: (draggedItem) => {
      if (draggedItem.index !== index) {
        moveTask(draggedItem.index, index);
        draggedItem.index = index;
      }
    },
  });

  drag(drop(ref));

  return (
    <motion.li
      ref={ref}
      className={`task ${task.completed ? "completed" : ""}`}
      style={{ opacity: isDragging ? 0.5 : 1 }}
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, x: -50 }}
    >
      {/* ✅ Clicking this marks the task as completed/pending */}
      <span onClick={() => toggleComplete(task.id)} style={{ cursor: "pointer" }}>
        {task.completed ? "✔️ " : "❌ "} {task.title}
      </span>

      {/* ✅ Restored Delete Button */}
      <motion.button onClick={() => deleteTask(task.id)} whileHover={{ scale: 1.2 }} style={{ marginLeft: "10px" }}>
        🗑️
      </motion.button>
    </motion.li>
  );
}

export default Task;
