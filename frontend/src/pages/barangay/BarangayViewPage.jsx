import React from "react";
import BarangayView from "./BarangayView";
import Layout from "../../layout/Layout";
import { useParams } from "react-router-dom";
const BarangayViewPage = () => {
  const { barangayId } = useParams();
  return (
    <Layout>
      <BarangayView barangayId={barangayId} />
    </Layout>
  );
};

export default BarangayViewPage;
