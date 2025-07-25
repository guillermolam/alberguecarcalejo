import React from "react";
import { BedData } from "./bed-manager";

interface BedButtonProps {
  bed: BedData;
  onClick: (bed: BedData) => void;
}

const getBedColor = (status: string) => {
  switch (status) {
    case "available":
      return "bg-green-100 border-green-300 text-green-700 hover:bg-green-200";
    case "occupied":
      return "bg-red-100 border-red-300 text-red-700";
    case "maintenance":
      return "bg-yellow-100 border-yellow-300 text-yellow-700";
    default:
      return "bg-gray-100 border-gray-300 text-gray-700";
  }
};

const getStatusDot = (status: string) => {
  switch (status) {
    case "available":
      return "bg-green-500";
    case "occupied":
      return "bg-red-500";
    case "maintenance":
      return "bg-yellow-500";
    default:
      return "bg-gray-500";
  }
};

export const BedButton: React.FC<BedButtonProps> = ({ bed, onClick }) => (
  <div className="relative">
    <button
      onClick={() => onClick(bed)}
      className={`w-12 h-12 border-2 rounded-lg flex items-center justify-center text-xs font-medium transition-colors ${getBedColor(bed.status)} ${
        bed.status === "available" ? "cursor-pointer" : "cursor-default"
      }`}
    >
      {bed.bedNumber}
    </button>
    <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${getStatusDot(bed.status)}`}></div>
  </div>
);
