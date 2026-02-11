import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { MoreVertical, Edit, Eye, UserCheck, UserX } from "lucide-react";

const RowActions = ({ official, onEdit, onView, onToggleStatus }) => {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef(null);

  const [position, setPosition] = useState({ top: 0, left: 0 });

  const toggleMenu = () => {
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
      });
    }
    setOpen(!open);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (buttonRef.current && !buttonRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <>
      <button
        ref={buttonRef}
        onClick={toggleMenu}
        className="p-1 rounded hover:bg-gray-100"
      >
        <MoreVertical size={18} />
      </button>

      {open &&
        createPortal(
          <div
            className="absolute w-40 bg-white border border-gray-200 rounded-md shadow-lg z-[1000]"
            style={{
              top: position.top,
              left: position.left,
            }}
          >
            <button
              className="flex items-center gap-2 px-3 py-2 hover:bg-blue-100 w-full text-left"
              onClick={() => onEdit(official)}
            >
              <Edit size={16} /> Edit
            </button>
            <button
              className="flex items-center gap-2 px-3 py-2 hover:bg-purple-100 w-full text-left"
              onClick={() => onView(official)}
            >
              <Eye size={16} /> View
            </button>
            <button
              className={`flex items-center gap-2 px-3 py-2 w-full text-left ${
                official.status === "Active"
                  ? "hover:bg-red-100 text-red-600"
                  : "hover:bg-emerald-100 text-emerald-700"
              }`}
              onClick={() => onToggleStatus(official)}
            >
              {official.status === "Active" ? (
                <>
                  <UserX size={16} /> Deactivate
                </>
              ) : (
                <>
                  <UserCheck size={16} /> Activate
                </>
              )}
            </button>
          </div>,
          document.body,
        )}
    </>
  );
};

export default RowActions;
