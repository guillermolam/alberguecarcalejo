import React from "react";
import { BedButton } from "./bed-button";
import { BedData } from "./bed-manager";

interface BedRoomGroupProps {
  roomKey: string;
  roomBeds: BedData[];
  onBedClick: (bed: BedData) => void;
}

export const BedRoomGroup: React.FC<BedRoomGroupProps> = ({ roomKey, roomBeds, onBedClick }) => {
  const room = roomBeds[0];
  return (
    <div key={roomKey} className="mb-6">
      <h5 className="font-medium text-gray-700 mb-3">
        {room.roomName} ({roomBeds.length} camas)
      </h5>
      <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
        {roomBeds.map((bed) => (
          <BedButton key={bed.id} bed={bed} onClick={onBedClick} />
        ))}
      </div>
    </div>
  );
};
