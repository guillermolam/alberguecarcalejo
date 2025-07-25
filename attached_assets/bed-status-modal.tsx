import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BedData } from "./bed-manager";

interface BedStatusModalProps {
  selectedBed: BedData;
  onStatusChange: (status: string) => void;
  onClose: () => void;
  isPending: boolean;
}

export const BedStatusModal: React.FC<BedStatusModalProps> = ({ selectedBed, onStatusChange, onClose, isPending }) => (
  <Card className="border-blue-200">
    <CardHeader>
      <CardTitle>
        Bed {selectedBed.bedNumber} - {selectedBed.roomName}
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <span>Current Status:</span>
          <Badge
            variant={
              selectedBed.status === "available"
                ? "default"
                : selectedBed.status === "occupied"
                ? "destructive"
                : "secondary"
            }
          >
            {selectedBed.status}
          </Badge>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={() => onStatusChange("available")}
            variant={selectedBed.status === "available" ? "default" : "outline"}
            size="sm"
            disabled={isPending}
          >
            Available
          </Button>
          <Button
            onClick={() => onStatusChange("occupied")}
            variant={selectedBed.status === "occupied" ? "default" : "outline"}
            size="sm"
            disabled={isPending}
          >
            Occupied
          </Button>
          <Button
            onClick={() => onStatusChange("maintenance")}
            variant={selectedBed.status === "maintenance" ? "default" : "outline"}
            size="sm"
            disabled={isPending}
          >
            Maintenance
          </Button>
        </div>
        <Button onClick={onClose} variant="outline" className="w-full">
          Close
        </Button>
      </div>
    </CardContent>
  </Card>
);
