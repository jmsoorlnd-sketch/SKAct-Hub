import React, { useState } from "react";
import Layout from "../../layout/Layout";

const Dashboard = () => {
  const [openCompose, setOpenCompose] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);

  return (
    <Layout>
      <div className="flex w-full h-full p-6 gap-6">
        {/* LEFT SIDE */}
        <div className="w-1/4"></div>

        {/* CENTER CONTENT */}
        <div className="w-2/4 bg-white rounded-xl p-6 shadow min-h-[600px]">
          <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
          <p>Your main content will appear here.</p>
        </div>

        {/* RIGHT SIDE */}
        <div className="w-1/4 flex flex-col gap-4">
          {/* COMPOSE BUTTON */}
          <button
            onClick={() => setOpenCompose(true)}
            className="flex items-center gap-3
            bg-[#D9EEFF] hover:bg-[#c9e7ff]
            text-black font-medium
            px-6 py-4 rounded-2xl shadow-sm
            transition w-40 justify-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.862 3.487a2.25 2.25 0 113.182 3.182L7.5 19.313 3 21l1.688-4.5L16.862 3.487z"
              />
            </svg>
            Compose
          </button>

          {/* INBOX */}
          <div
            className="flex items-center bg-blue-100 px-4 py-3 
            rounded-xl cursor-pointer hover:bg-blue-200 transition shadow"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5 mr-2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25H4.5a2.25 2.25 0 01-2.25-2.25V6.75M21.75 6.75A2.25 2.25 0 0019.5 4.5H4.5A2.25 2.25 0 002.25 6.75M21.75 6.75v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.583a2.25 2.25 0 01-2.31 0L3.37 8.909a2.25 2.25 0 01-1.12-1.916V6.75"
              />
            </svg>
            <span className="font-medium">Inbox</span>
          </div>
        </div>
      </div>

      {/* ==============================
              COMPOSE POPUP WINDOW
      =============================== */}
      {openCompose && (
        <div className="fixed bottom-4 right-6 w-[450px] bg-white shadow-xl rounded-lg border">
          {/* HEADER */}
          <div className="flex justify-between items-center px-4 py-2 bg-gray-100 rounded-t-lg border-b">
            <span className="font-medium">New Message</span>
            <button
              onClick={() => {
                setOpenCompose(false);
                setAttachedFile(null);
              }}
              className="text-gray-500 hover:text-black"
            >
              ✕
            </button>
          </div>

          {/* BODY */}
          <div className="flex flex-col px-4 py-3">
            <input
              type="text"
              placeholder="To"
              className="border-b py-2 text-sm outline-none"
            />

            <input
              type="text"
              placeholder="Subject"
              className="border-b py-2 text-sm outline-none mt-2"
            />

            <textarea
              placeholder="Message..."
              className="mt-3 h-40 resize-none outline-none text-sm"
            />

            {/* SHOW ATTACHED FILE NAME */}
            {attachedFile && (
              <div className="mt-2 text-sm bg-gray-100 p-2 rounded border flex justify-between items-center">
                <span>{attachedFile.name}</span>
                <button
                  className="text-red-500 text-xs"
                  onClick={() => setAttachedFile(null)}
                >
                  Remove
                </button>
              </div>
            )}
          </div>

          {/* FOOTER */}
          <div className="flex items-center gap-3 px-4 py-3">
            {/* SEND BUTTON */}
            <button className="bg-blue-600 text-white px-6 py-2 rounded-lg shadow">
              Send
            </button>

            {/* ATTACH FILE BUTTON */}
            <label className="cursor-pointer">
              <input
                type="file"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files.length > 0) {
                    setAttachedFile(e.target.files[0]);
                  }
                }}
              />

              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6 text-gray-600 hover:text-black transition"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M18.364 5.636l-7.778 7.778a3 3 0 11-4.243-4.243l7.778-7.778a4.5 4.5 0 016.364 6.364l-7.778 7.778a6 6 0 01-8.486-8.486l7.778-7.778"
                />
              </svg>
            </label>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Dashboard;
