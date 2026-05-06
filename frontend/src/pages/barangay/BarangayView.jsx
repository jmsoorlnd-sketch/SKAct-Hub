// import React, { useEffect, useState } from "react";
// import axios from "axios";
// import { MapPin, Users, Award } from "lucide-react";

// export default function BarangayView({ barangayId }) {
//   const [barangay, setBarangay] = useState(null);
//   const [officials, setOfficials] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     fetchData();
//   }, [barangayId]);

//   const fetchData = async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       await Promise.all([fetchBarangay(), fetchOfficials()]);
//     } catch (err) {
//       setError("Failed to load barangay data");
//       console.error("Error loading data:", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchBarangay = async () => {
//     try {
//       const token = localStorage.getItem("token");
//       const res = await axios.get(
//         `${window.API_BASE}/barangays/get-barangay/${barangayId.trim()}`,
//         {
//           headers: { Authorization: `Bearer ${token}` },
//         },
//       );
//       setBarangay(res.data.barangay);
//     } catch (err) {
//       console.error("Error fetching barangay:", err);
//       throw err;
//     }
//   };

//   const fetchOfficials = async () => {
//     try {
//       const token = localStorage.getItem("token");
//       // Fixed: Use consistent URL format
//       const res = await axios.get(
//         `${window.API_BASE}/barangays/officials/${barangayId.trim()}`,
//         {
//           headers: { Authorization: `Bearer ${token}` },
//         },
//       );
//       // Fixed: Ensure officials is always an array
//       setOfficials(
//         Array.isArray(res.data?.officials) ? res.data.officials : [],
//       );
//       console.log("Officials loaded:", res.data?.officials);
//     } catch (err) {
//       console.error("Error fetching officials:", err);
//       setOfficials([]);
//       throw err;
//     }
//   };

//   const chairman = officials.find(
//     (official) =>
//       official.position === "Chairman" && official.status === "Active",
//   );

//   if (loading) {
//     return (
//       <div className="p-6 flex items-center justify-center min-h-screen">
//         <div className="text-center">
//           <div className="inline-flex items-center justify-center w-16 h-16 mb-4 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full animate-spin">
//             <div className="w-12 h-12 bg-white rounded-full animate-spin"></div>
//           </div>
//           <p className="text-gray-600 font-medium">
//             Loading barangay details...
//           </p>
//         </div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="p-6">
//         <div className="bg-gradient-to-r from-red-50 to-red-100 border-l-4 border-red-500 text-red-700 px-6 py-4 rounded-lg shadow-md">
//           <p className="font-semibold text-lg">{error}</p>
//           <p className="text-sm text-red-600 mt-1">
//             Please refresh or try again later
//           </p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="p-6 space-y-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
//       {/* ENHANCED HEADER CARD */}
//       <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl shadow-xl p-8 text-white hover:shadow-2xl transition-all duration-300 group">
//         <div className="flex items-center justify-between">
//           <div className="flex-1">
//             <h1 className="text-4xl font-bold mb-2 group-hover:translate-x-1 transition-transform duration-300">
//               {barangay?.barangayName}
//             </h1>
//             <div className="flex items-center gap-2 text-blue-100 text-lg">
//               <MapPin className="w-5 h-5" />
//               <p>
//                 {barangay?.region} • {barangay?.province} • {barangay?.city}
//               </p>
//             </div>
//           </div>
//           <div className="hidden md:flex flex-col items-center justify-center bg-white/20 rounded-xl p-4 backdrop-blur-sm group-hover:bg-white/30 transition-all duration-300">
//             <Users className="w-8 h-8 mb-2 text-blue-100" />
//             <p className="text-sm font-semibold">{officials.length}</p>
//             <p className="text-xs text-blue-100">Officials</p>
//           </div>
//         </div>
//       </div>

//       {/* GRID: CHAIRMAN + INFO */}
//       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//         {/* ENHANCED CHAIRMAN CARD */}
//         <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 p-6 border border-gray-200 hover:border-blue-300 group hover:translate-y-[-4px]">
//           <div className="flex items-center gap-2 mb-4">
//             <Award className="w-5 h-5 text-amber-500" />
//             <h2 className="text-lg font-semibold text-gray-900">Chairman</h2>
//           </div>
//           {chairman ? (
//             <div className="text-center">
//               {chairman.profileImage && (
//                 <div className="mb-4 flex justify-center">
//                   <img
//                     src={chairman.profileImage}
//                     alt={`${chairman.firstname} ${chairman.lastname}`}
//                     className="w-24 h-24 rounded-full mx-auto object-cover border-4 border-blue-100 shadow-lg group-hover:scale-110 transition-transform duration-300 group-hover:border-blue-400"
//                   />
//                 </div>
//               )}
//               <h3 className="font-bold text-gray-900 text-lg">
//                 {chairman.firstname} {chairman.lastname}
//               </h3>
//               {chairman.email && (
//                 <p className="text-blue-600 text-sm mt-2 break-words">
//                   {chairman.email}
//                 </p>
//               )}
//               <div className="mt-4 inline-block bg-gradient-to-r from-amber-100 to-amber-50 px-3 py-1 rounded-full">
//                 <p className="text-xs font-semibold text-amber-800">
//                   {chairman.position}
//                 </p>
//               </div>
//             </div>
//           ) : (
//             <div className="text-center py-8">
//               <p className="text-gray-500">No active chairman</p>
//             </div>
//           )}
//         </div>

//         {/* ENHANCED BARANGAY INFO */}
//         <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 p-6 border border-gray-200 hover:border-green-300 group md:col-span-2 hover:translate-y-[-4px]">
//           <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
//             <MapPin className="w-5 h-5 text-green-500" />
//             Barangay Information
//           </h2>
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//             <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200 group-hover:from-blue-100 group-hover:to-blue-200 transition-all duration-300">
//               <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
//                 Region
//               </p>
//               <p className="text-lg font-bold text-gray-900 mt-1">
//                 {barangay?.region || "N/A"}
//               </p>
//             </div>
//             <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200 group-hover:from-green-100 group-hover:to-green-200 transition-all duration-300">
//               <p className="text-xs font-semibold text-green-600 uppercase tracking-wide">
//                 Province
//               </p>
//               <p className="text-lg font-bold text-gray-900 mt-1">
//                 {barangay?.province || "N/A"}
//               </p>
//             </div>
//             <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200 group-hover:from-purple-100 group-hover:to-purple-200 transition-all duration-300">
//               <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide">
//                 City
//               </p>
//               <p className="text-lg font-bold text-gray-900 mt-1">
//                 {barangay?.city || "N/A"}
//               </p>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* ENHANCED OFFICIALS TABLE */}
//       <SectionTable
//         title="Officials"
//         data={officials}
//         columns={["firstname", "lastname", "position", "status"]}
//       />
//     </div>
//   );
// }

// /* ENHANCED REUSABLE TABLE SECTION */
// function SectionTable({ title, data = [], columns }) {
//   const getStatusColor = (status) => {
//     if (!status) return "bg-gray-100 text-gray-700";
//     const normalized = status.toLowerCase();
//     if (normalized === "active")
//       return "bg-gradient-to-r from-green-100 to-green-50 text-green-700 border border-green-200";
//     if (normalized === "inactive")
//       return "bg-gradient-to-r from-red-100 to-red-50 text-red-700 border border-red-200";
//     if (normalized === "pending")
//       return "bg-gradient-to-r from-yellow-100 to-yellow-50 text-yellow-700 border border-yellow-200";
//     return "bg-gray-100 text-gray-700 border border-gray-200";
//   };

//   return (
//     <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300">
//       <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
//         <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
//           <Users className="w-5 h-5 text-blue-600" />
//           {title}
//         </h2>
//       </div>

//       <div className="overflow-auto max-h-96">
//         <table className="min-w-full">
//           <thead className="bg-gradient-to-r from-gray-100 to-gray-50 sticky top-0 z-10">
//             <tr>
//               {columns.map((col) => (
//                 <th
//                   key={col}
//                   className="p-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider capitalize border-b border-gray-200"
//                 >
//                   {col.replace(/([A-Z])/g, " $1")}
//                 </th>
//               ))}
//             </tr>
//           </thead>

//           <tbody>
//             {data.length === 0 ? (
//               <tr>
//                 <td
//                   className="p-8 text-gray-500 text-center text-sm"
//                   colSpan={columns.length}
//                 >
//                   <div className="flex flex-col items-center justify-center gap-2">
//                     <Users className="w-8 h-8 text-gray-300" />
//                     <p>No officials found</p>
//                   </div>
//                 </td>
//               </tr>
//             ) : (
//               data.map((item, index) => (
//                 <tr
//                   key={item._id || index}
//                   className="border-b border-gray-100 hover:bg-gradient-to-r hover:from-blue-50 hover:to-transparent transition-all duration-200 group"
//                 >
//                   {columns.map((col) => {
//                     const value =
//                       typeof item[col] === "object"
//                         ? item[col]?.firstname ||
//                           item[col]?.documentName ||
//                           "N/A"
//                         : item[col] || "N/A";

//                     if (col === "status") {
//                       return (
//                         <td key={col} className="p-4">
//                           <span
//                             className={`inline-block px-4 py-2 rounded-full text-xs font-bold ${getStatusColor(value)} transition-all duration-200 group-hover:shadow-md`}
//                           >
//                             {value}
//                           </span>
//                         </td>
//                       );
//                     }

//                     return (
//                       <td
//                         key={col}
//                         className="p-4 text-sm text-gray-700 group-hover:text-gray-900 transition-colors duration-200"
//                       >
//                         {col === "position" ? (
//                           <span className="font-semibold">{value}</span>
//                         ) : (
//                           value
//                         )}
//                       </td>
//                     );
//                   })}
//                 </tr>
//               ))
//             )}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// }
