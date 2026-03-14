import { memo } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const Calendar = ({ renderCalendar, handleNextMonth, handlePrevMonth }) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg border-2 border-slate-200 overflow-hidden mb-8">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5">
        <div className="flex justify-between items-center">
          <button
            onClick={handlePrevMonth}
            className="p-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <ChevronLeft size={18} />
            <span className="font-semibold">Previous</span>
          </button>
          <h2 className="text-2xl font-bold text-white">
            {renderCalendar().monthName}
          </h2>
          <button
            onClick={handleNextMonth}
            className="p-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <span className="font-semibold">Next</span>
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-7 gap-2 mb-2">
          {[
            "Sunday",
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
          ].map((day) => (
            <div
              key={day}
              className="font-bold text-center text-slate-700 bg-gradient-to-br from-slate-100 to-slate-50 py-3 rounded-xl border-2 border-slate-200"
            >
              <span className="hidden md:inline">{day}</span>
              <span className="md:hidden">{day.slice(0, 3)}</span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">{renderCalendar().days}</div>
      </div>
    </div>
  );
};

export default memo(Calendar);
