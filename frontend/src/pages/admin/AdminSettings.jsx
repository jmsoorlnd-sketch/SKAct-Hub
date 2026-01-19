import React from "react";
import Layout from "../../layout/Layout";
import { Info } from "lucide-react";

const AdminSettings = () => {
  return (
    <Layout>
      <div className="flex flex-1 min-h-screen bg-white">
        {/* Sidebar Navigation */}
        <div className="w-64 bg-white shadow-lg border-r border-gray-200">
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Settings Menu
            </h2>
            <nav className="flex flex-col gap-2">
              <div className="flex items-center gap-3 w-full p-3 rounded-lg bg-blue-600 text-white">
                <Info size={20} />
                <span className="font-medium">About Us</span>
              </div>
            </nav>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-8">
          <div className="max-w-4xl mx-auto">
            {/* About Us Section */}
            <div>
              <div className="mb-8">
                <h1 className="text-4xl font-bold text-gray-900 mb-2">
                  About Us
                </h1>
                <p className="text-gray-600">
                  Learn more about SKhub and our mission
                </p>
              </div>

              {/* About Us Card */}
              <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                <div className="flex items-start gap-4">
                  <Info size={32} className="text-blue-600 shrink-0 mt-1" />
                  <div className="flex-1">
                    <div className="space-y-4 text-gray-700">
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">
                          Version
                        </h3>
                        <p className="text-sm">1.0.0</p>
                      </div>

                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">
                          About SKhub
                        </h3>
                        <p className="text-sm leading-relaxed">
                          SKhub is a comprehensive digital platform designed to
                          support the Sangguniang Kabataan (SK) and youth
                          development initiatives. Our mission is to streamline
                          communication, event scheduling, and resource
                          management for youth organizations and barangay
                          officials.
                        </p>
                      </div>

                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">
                          Key Features
                        </h3>
                        <ul className="text-sm list-disc list-inside space-y-1">
                          <li>Event scheduling and management</li>
                          <li>Message communication system</li>
                          <li>Barangay document storage</li>
                          <li>Youth profile management</li>
                          <li>Monitoring and evaluation tools</li>
                          <li>Comprehensive reporting system</li>
                        </ul>
                      </div>

                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">
                          Contact & Support
                        </h3>
                        <p className="text-sm">
                          For technical support or inquiries, please contact the
                          administration through the dashboard.
                        </p>
                      </div>

                      <div className="pt-4 border-t border-gray-200">
                        <p className="text-xs text-gray-500">
                          © 2024-2026 SKhub. All rights reserved.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdminSettings;
