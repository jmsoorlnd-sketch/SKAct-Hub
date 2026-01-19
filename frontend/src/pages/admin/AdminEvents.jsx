import React from "react";
import Layout from "../../layout/Layout";
import EventScheduler from "../../components/EventScheduler";

const AdminEvents = () => {
  return (
    <Layout>
      <div className="w-full">
        <EventScheduler />
      </div>
    </Layout>
  );
};

export default AdminEvents;
