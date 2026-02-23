import React from "react";
import BarangayView from "./BarangayView";
import { useParams } from "react-router-dom";
const BarangayViewPage = () => {
  const { barangayId } = useParams();
  return (
    <>
      <BarangayView barangayId={barangayId} />
    </>
  );
};

export default BarangayViewPage;
