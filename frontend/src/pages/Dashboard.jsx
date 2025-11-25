import React from "react";
import Layout from "../layout/Layout";

const Dashboard = () => {
  return (
    <Layout>
      {/* sidebar */}
      <div className="flex min-h-screen w-full">
        {/* main content */}
        <div className="min-h-screen w-2/4 border">
          <p>uygfsi</p>
        </div>

        {/* right content */}
        <div className="w-full flex min-h-screen border">
          <p>aosidhosibn</p>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
