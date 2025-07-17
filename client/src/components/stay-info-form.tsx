import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { i18n } from "@/lib/i18n";

interface StayInfoFormProps {
  onContinue: (stayData: StayData) => void;
}

export interface StayData {
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  guests: number;
}

export function StayInfoForm({ onContinue }: StayInfoFormProps) {
  const [checkInDate, setCheckInDate] = useState("");
  const [checkOutDate, setCheckOutDate] = useState("");
  const [nights, setNights] = useState(1);
  const [guests] = useState(1); // Fixed to 1 for individual registration

  const { data: availability, isLoading, error } = useQuery({
    queryKey: ['/api/availability', checkInDate, checkOutDate, guests],
    enabled: !!(checkInDate && checkOutDate),
    queryFn: async () => {
      const response = await apiRequest('POST', '/api/availability', {
        checkInDate,
        checkOutDate,
        numberOfPersons: guests
      });
      return response.json();
    }
  });

  const handleCheckInDateChange = (date: string) => {
    setCheckInDate(date);
    if (date && checkOutDate) {
      const startDate = new Date(date);
      const endDate = new Date(checkOutDate);
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setNights(diffDays);
    }
  };

  const handleCheckOutDateChange = (date: string) => {
    setCheckOutDate(date);
    if (checkInDate && date) {
      const startDate = new Date(checkInDate);
      const endDate = new Date(date);
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setNights(diffDays);
    }
  };

  const handleNightsChange = (nightsValue: number) => {
    setNights(nightsValue);
    if (checkInDate) {
      const startDate = new Date(checkInDate);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + nightsValue);
      setCheckOutDate(endDate.toISOString().split('T')[0]);
    }
  };

  const handleContinue = () => {
    if (availability?.available) {
      onContinue({
        checkInDate,
        checkOutDate,
        nights,
        guests
      });
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardContent className="p-6">
        <h3 className="text-2xl font-semibold text-gray-900 mb-6">
          {i18n.t('stay.title')}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="md:col-span-2">
            <Label className="text-sm font-medium text-gray-700 mb-2">
              {i18n.t('stay.dates')}
            </Label>
            <div className="flex space-x-2">
              <Input
                type="date"
                value={checkInDate}
                onChange={(e) => handleCheckInDateChange(e.target.value)}
                min={today}
                className="flex-1"
              />
              <Input
                type="date"
                value={checkOutDate}
                onChange={(e) => handleCheckOutDateChange(e.target.value)}
                min={checkInDate || today}
                className="flex-1"
              />
            </div>
          </div>
          
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2">
              {i18n.t('stay.nights')}
            </Label>
            <Input
              type="number"
              value={nights}
              onChange={(e) => handleNightsChange(parseInt(e.target.value))}
              min="1"
              max="14"
              className="w-full"
            />
          </div>
          
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2">
              {i18n.t('stay.guests')}
            </Label>
            <Select value="1" disabled>
              <SelectTrigger className="w-full">
                <SelectValue>1 {i18n.t('stay.guest_single')}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 {i18n.t('stay.guest_single')}</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 mt-1">
              {i18n.t('stay.individual_only')}
            </p>
          </div>
        </div>
        
        {isLoading && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Checking availability...
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Error checking availability. Please try again.
            </AlertDescription>
          </Alert>
        )}

        {availability && (
          <div className="mb-6">
            {availability.available ? (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <AlertDescription className="text-green-800">
                  {i18n.t('stay.available', { count: availability.availableBeds })}
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {i18n.t('stay.not_available')}
                  {availability.nextAvailableDate && (
                    <div className="mt-2">
                      {i18n.t('stay.next_available', { date: availability.nextAvailableDate })}
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        <Button
          onClick={handleContinue}
          disabled={!availability?.available || isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
        >
          {i18n.t('stay.continue')}
          <span className="ml-2">→</span>
        </Button>
      </CardContent>
    </Card>
  );
}
