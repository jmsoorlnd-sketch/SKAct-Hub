import { Users, X, Calendar, Mail, MessageSquare } from "lucide-react";
const SkProfileModal = ({
  setSelectedOfficial,
  setProfileOpen,
  profileLoading,
  profileMessages,
  setProfileMessages,
  selectedOfficial,
}) => {
  return (
    <div className="fixed inset-0 bg-black/50  flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center font-bold text-blue-600 text-2xl shadow-lg">
                {selectedOfficial.firstname.charAt(0)}
                {selectedOfficial.lastname.charAt(0)}
              </div>
              <div className="text-white">
                <h3 className="text-2xl font-bold">
                  {selectedOfficial.firstname} {selectedOfficial.lastname}
                </h3>
                <p className="text-blue-100 mt-1">
                  {selectedOfficial.position}
                </p>
                <p className="text-blue-200 text-sm mt-1">
                  {selectedOfficial.barangay?.barangayName}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setProfileOpen(false);
                setSelectedOfficial(null);
                setProfileMessages([]);
              }}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X size={24} className="text-white" />
            </button>
          </div>
        </div>

        <div
          className="p-6 overflow-y-auto"
          style={{ maxHeight: "calc(90vh - 180px)" }}
        >
          {/* Contact Information */}
          <div className="mb-6">
            <h4 className="text-lg font-bold text-slate-900 mb-4">
              Contact Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border-2 border-slate-200">
                <Mail className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-xs text-slate-500 font-semibold">Email</p>
                  <p className="text-sm text-slate-900 font-medium">
                    {selectedOfficial.email}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border-2 border-slate-200">
                <Users className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-xs text-slate-500 font-semibold">
                    Username
                  </p>
                  <p className="text-sm text-slate-900 font-medium">
                    @{selectedOfficial.username}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-600" />
                Messages ({profileMessages.length})
              </h4>
            </div>

            {profileLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent mx-auto"></div>
                <p className="text-slate-500 text-sm mt-2">
                  Loading messages...
                </p>
              </div>
            ) : profileMessages.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <MessageSquare className="text-slate-400" size={32} />
                </div>
                <p className="text-slate-500 font-medium">No messages found</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {profileMessages.map((msg) => (
                  <div
                    key={msg._id}
                    className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h5 className="font-bold text-slate-900">
                        {msg.subject}
                      </h5>
                      <span className="px-2 py-1 bg-blue-200 text-blue-700 rounded-md text-xs font-bold">
                        {msg.status}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 mb-2">{msg.body}</p>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <div className="flex items-center gap-1">
                        <Calendar size={12} />
                        {new Date(msg.createdAt).toLocaleDateString()}
                      </div>
                      {msg.sender && (
                        <span>
                          From: {msg.sender.firstname} {msg.sender.lastname}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkProfileModal;
