import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { i18n } from "@/lib/i18n";
import { Bed } from "lucide-react";

interface BedData {
  id: number;
  bedNumber: number;
  roomNumber: number;
  roomName: string;
  status: 'available' | 'occupied' | 'maintenance';
  isAvailable: boolean;
}

export function BedManager() {
  const [selectedBed, setSelectedBed] = useState<BedData | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: beds, isLoading } = useQuery({
    queryKey: ['/api/beds'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/beds');
      return response.json() as Promise<BedData[]>;
    }
  });

  const updateBedStatusMutation = useMutation({
    mutationFn: async ({ bedId, status }: { bedId: number; status: string }) => {
      const response = await apiRequest('PATCH', `/api/beds/${bedId}/status`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/beds'] });
      toast({
        title: "Success",
        description: "Bed status updated successfully",
      });
      setSelectedBed(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleBedClick = (bed: BedData) => {
    setSelectedBed(bed);
  };

  const handleStatusChange = (status: string) => {
    if (selectedBed) {
      updateBedStatusMutation.mutate({ bedId: selectedBed.id, status });
    }
  };

  const getBedColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 border-green-300 text-green-700 hover:bg-green-200';
      case 'occupied':
        return 'bg-red-100 border-red-300 text-red-700';
      case 'maintenance':
        return 'bg-yellow-100 border-yellow-300 text-yellow-700';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-700';
    }
  };

  const getStatusDot = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-500';
      case 'occupied':
        return 'bg-red-500';
      case 'maintenance':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading bed information...</div>;
  }

  const roomGroups = beds?.reduce((groups: Record<string, BedData[]>, bed) => {
    const roomKey = `${bed.roomNumber}-${bed.roomName}`;
    if (!groups[roomKey]) {
      groups[roomKey] = [];
    }
    groups[roomKey].push(bed);
    return groups;
  }, {});

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bed className="w-5 h-5 mr-2" />
            {i18n.t('admin.bed_status')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {Object.entries(roomGroups || {}).map(([roomKey, roomBeds]) => {
            const room = roomBeds[0];
            return (
              <div key={roomKey} className="mb-6">
                <h5 className="font-medium text-gray-700 mb-3">
                  {room.roomName} ({roomBeds.length} camas)
                </h5>
                <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
                  {roomBeds.map((bed) => (
                    <div key={bed.id} className="relative">
                      <button
                        onClick={() => handleBedClick(bed)}
                        className={`w-12 h-12 border-2 rounded-lg flex items-center justify-center text-xs font-medium transition-colors ${getBedColor(bed.status)} ${
                          bed.status === 'available' ? 'cursor-pointer' : 'cursor-default'
                        }`}
                      >
                        {bed.bedNumber}
                      </button>
                      <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${getStatusDot(bed.status)}`}></div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Legend */}
          <div className="flex items-center space-x-6 text-sm mt-6">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
              <span className="text-gray-700">{i18n.t('admin.available')}</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-red-500 rounded-full mr-2"></div>
              <span className="text-gray-700">{i18n.t('admin.occupied')}</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-yellow-500 rounded-full mr-2"></div>
              <span className="text-gray-700">{i18n.t('admin.maintenance')}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bed Status Change Modal */}
      {selectedBed && (
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
                <Badge variant={
                  selectedBed.status === 'available' ? 'default' :
                  selectedBed.status === 'occupied' ? 'destructive' : 'secondary'
                }>
                  {selectedBed.status}
                </Badge>
              </div>
              
              <div className="flex space-x-2">
                <Button
                  onClick={() => handleStatusChange('available')}
                  variant={selectedBed.status === 'available' ? 'default' : 'outline'}
                  size="sm"
                  disabled={updateBedStatusMutation.isPending}
                >
                  Available
                </Button>
                <Button
                  onClick={() => handleStatusChange('occupied')}
                  variant={selectedBed.status === 'occupied' ? 'default' : 'outline'}
                  size="sm"
                  disabled={updateBedStatusMutation.isPending}
                >
                  Occupied
                </Button>
                <Button
                  onClick={() => handleStatusChange('maintenance')}
                  variant={selectedBed.status === 'maintenance' ? 'default' : 'outline'}
                  size="sm"
                  disabled={updateBedStatusMutation.isPending}
                >
                  Maintenance
                </Button>
              </div>
              
              <Button
                onClick={() => setSelectedBed(null)}
                variant="outline"
                className="w-full"
              >
                Close
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
