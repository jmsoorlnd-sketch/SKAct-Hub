import { memo } from "react";
import {
  Download,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const ProjectOverview = ({
  barangays,
  ongoingMap,
  completedMap,
  storageByBarangay,
  carouselIndex,
  setCarouselIndex,
  animatingBarangay,
  setAnimatingBarangay,
  setSelectedMessage,
  fetchActivityUpdates,
}) => {
  return (
    <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg border-2 border-slate-200 overflow-hidden">
      <div className="bg-gradient-to-r from-slate-50 to-blue-50 px-6 py-4 border-b-2 border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Project Distribution by Barangay
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Current status across all barangays
            </p>
          </div>
        </div>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto">
          {barangays.map((b) => {
            const ongoingItems = ongoingMap[b._id] || [];
            const completedItems = completedMap[b._id] || [];
            const barangayStorage = storageByBarangay[b._id] || [];
            const hasOngoing = ongoingItems.length > 0;

            const currentIndex = carouselIndex[b._id] || 0;
            const currentItem = ongoingItems[currentIndex];
            const isAnimating = animatingBarangay === b._id;

            const handleCarouselChange = (newIndex) => {
              setAnimatingBarangay(b._id);
              setCarouselIndex((prev) => ({
                ...prev,
                [b._id]: newIndex,
              }));
              setTimeout(() => setAnimatingBarangay(null), 250);
            };

            return (
              <div
                key={b._id}
                className={`border-2 rounded-xl p-4 transition-all hover:shadow-md ${
                  hasOngoing
                    ? "bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200"
                    : "bg-gradient-to-br from-slate-50 to-gray-50 border-slate-200"
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-900 text-lg">
                      {b.barangayName || b.barangay}
                    </h3>
                    <p className="text-xs text-slate-600 mt-1">
                      {b.city}, {b.province}
                    </p>
                  </div>
                  <div>
                    {hasOngoing ? (
                      <span className="px-3 py-1 bg-amber-500 text-white rounded-lg text-xs font-bold shadow-md">
                        {ongoingItems.length} Ongoing
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-slate-300 text-slate-700 rounded-lg text-xs font-bold">
                        No Ongoing
                      </span>
                    )}
                  </div>
                </div>

                {/* Statistics */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="text-center p-2 bg-white rounded-lg border border-slate-200">
                    <p className="text-lg font-bold text-slate-900">
                      {barangayStorage.length}
                    </p>
                    <p className="text-xs text-slate-500 font-semibold">
                      Total
                    </p>
                  </div>
                  <div className="text-center p-2 bg-white rounded-lg border border-emerald-200">
                    <p className="text-lg font-bold text-emerald-600">
                      {completedItems.length}
                    </p>
                    <p className="text-xs text-slate-500 font-semibold">Done</p>
                  </div>
                  <div className="text-center p-2 bg-white rounded-lg border border-amber-200">
                    <p className="text-lg font-bold text-amber-600">
                      {ongoingItems.length}
                    </p>
                    <p className="text-xs text-slate-500 font-semibold">
                      Active
                    </p>
                  </div>
                </div>

                {/* Carousel for ongoing projects */}
                {hasOngoing && ongoingItems.length > 0 && (
                  <div className="relative bg-white rounded-lg p-3 border-2 border-amber-200">
                    {/* Previous Button - Left Side */}
                    <button
                      onClick={() => {
                        handleCarouselChange(
                          currentIndex === 0
                            ? ongoingItems.length - 1
                            : currentIndex - 1,
                        );
                      }}
                      disabled={ongoingItems.length <= 1}
                      className="absolute left-1 top-1/2 -translate-y-1/2 p-1.5 bg-slate-200 hover:bg-slate-300 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 rounded-lg transition-colors flex items-center justify-center z-30 ring-1 ring-slate-100"
                    >
                      <ChevronLeft size={18} />
                    </button>

                    {/* Content */}
                    <div
                      className={`pr-10 pl-10 py-2 carousel-card ${isAnimating ? "carousel-card-out" : "carousel-card-current"}`}
                      key={`${b._id}-${currentIndex}`}
                    >
                      {/* Project counter */}
                      <div className="text-center text-xs text-slate-500 font-semibold mb-2">
                        {currentIndex + 1} of {ongoingItems.length}
                      </div>

                      <h4 className="font-semibold text-slate-900 text-sm mb-1 truncate">
                        {currentItem.documentName ||
                          currentItem.document?.subject}
                      </h4>
                      <p className="text-xs text-slate-600 mb-2">
                        From:{" "}
                        {currentItem.document?.sender?.firstname ||
                          currentItem.uploadedBy?.firstname}{" "}
                        {currentItem.document?.sender?.lastname ||
                          currentItem.uploadedBy?.lastname}
                      </p>

                      <div className="flex gap-2">
                        <button
                          onClick={async () => {
                            const msgId =
                              currentItem.document?._id ||
                              currentItem._id ||
                              currentItem.document;
                            setSelectedMessage({
                              barangayId: b._id,
                              barangayName: b.barangayName || b.barangay,
                              messageId: msgId,
                              title:
                                currentItem.documentName ||
                                currentItem.document?.subject,
                            });
                            await fetchActivityUpdates(msgId);
                          }}
                          className="flex-1 px-3 py-1.5 bg-blue-700 hover:bg-blue-600 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                        >
                          <ImageIcon size={14} />
                          Updates
                        </button>
                        {currentItem.documentUrl && (
                          <a
                            href={`${window.BACKEND_URL}${currentItem.documentUrl}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                          >
                            <Download size={14} />
                            Open
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Next Button - Right Side */}
                    <button
                      onClick={() => {
                        handleCarouselChange(
                          currentIndex === ongoingItems.length - 1
                            ? 0
                            : currentIndex + 1,
                        );
                      }}
                      disabled={ongoingItems.length <= 1}
                      className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 bg-slate-200 hover:bg-slate-300 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 rounded-lg transition-colors flex items-center justify-center z-30 ring-1 ring-slate-100"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                )}

                {!hasOngoing && (
                  <p className="text-sm text-slate-500 text-center py-2">
                    No ongoing projects
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default memo(ProjectOverview);
