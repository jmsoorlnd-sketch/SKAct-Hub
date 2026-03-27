import { memo } from "react";
import { ChevronDown } from "lucide-react";

const LogRow = ({
  log,
  expandedId,
  setExpandedId,
  ActionBadge,
  ExpandedDetails,
}) => {
  const isExpanded = expandedId === log._id;
  return (
    <>
      <tr
        className="border-b border-gray-50 hover:bg-gray-50 transition cursor-pointer"
        onClick={() => setExpandedId(expandedId === log._id ? null : log._id)}
      >
        <td className="px-4 py-2.5 text-gray-500 whitespace-nowrap text-xs">
          {new Date(log.createdAt).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </td>
        <td className="px-4 py-2.5">
          <p className="font-medium text-gray-900 leading-tight">
            {log.firstname} {log.lastname}
          </p>
          <p className="text-xs text-gray-400">@{log.username}</p>
        </td>
        <td className="px-4 py-2.5">
          <ActionBadge actionType={log.actionType} />
        </td>
        <td className="px-4 py-2.5 text-gray-500 max-w-xs truncate">
          {log.description ?? "—"}
        </td>

        <td className="px-4 py-2.5 text-gray-300">
          <ChevronDown
            size={14}
            className={`transition-transform ${expandedId === log._id ? "rotate-180" : ""}`}
          />
        </td>
      </tr>
      {expandedId === log._id && <ExpandedDetails log={log} />}
    </>
  );
};

export default memo(LogRow);
