import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BedManager } from "@/components/bed-manager";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  BarChart3, 
  Bed, 
  Euro, 
  Clock, 
  Shield,
  TrendingUp,
  Users,
  Calendar
} from "lucide-react";
import { i18n } from "@/lib/i18n";

export default function Admin() {
  const [activeTab, setActiveTab] = useState("dashboard");

  const { data: dashboardStats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/dashboard/stats'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/dashboard/stats');
      return response.json();
    }
  });

  const { data: recentBookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ['/api/bookings/recent'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/bookings/recent');
      return response.json();
    }
  });

  const StatCard = ({ title, value, icon: Icon, color }: {
    title: string;
    value: string | number;
    icon: any;
    color: string;
  }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-semibold text-gray-900">{value}</p>
          </div>
          <Icon className={`h-8 w-8 ${color}`} />
        </div>
      </CardContent>
    </Card>
  );

  if (statsLoading) {
    return <div className="min-h-screen bg-gray-50 p-6">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-gray-900 text-white min-h-screen">
          <div className="p-6">
            <h2 className="text-xl font-semibold">{i18n.t('admin.title')}</h2>
          </div>
          
          <nav className="mt-6">
            <Button
              variant={activeTab === 'dashboard' ? 'secondary' : 'ghost'}
              className="w-full justify-start text-left px-6 py-3 text-gray-300 hover:bg-gray-700 hover:text-white"
              onClick={() => setActiveTab('dashboard')}
            >
              <BarChart3 className="w-5 h-5 mr-3" />
              {i18n.t('admin.dashboard')}
            </Button>
            
            <Button
              variant={activeTab === 'beds' ? 'secondary' : 'ghost'}
              className="w-full justify-start text-left px-6 py-3 text-gray-300 hover:bg-gray-700 hover:text-white"
              onClick={() => setActiveTab('beds')}
            >
              <Bed className="w-5 h-5 mr-3" />
              {i18n.t('admin.beds')}
            </Button>
            
            <Button
              variant={activeTab === 'payments' ? 'secondary' : 'ghost'}
              className="w-full justify-start text-left px-6 py-3 text-gray-300 hover:bg-gray-700 hover:text-white"
              onClick={() => setActiveTab('payments')}
            >
              <Euro className="w-5 h-5 mr-3" />
              {i18n.t('admin.payments')}
            </Button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <h3 className="text-2xl font-semibold text-gray-900">
                {i18n.t('admin.dashboard')}
              </h3>
              
              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard
                  title={i18n.t('admin.occupancy_today')}
                  value={`${dashboardStats?.occupancy?.occupied || 0}/${dashboardStats?.occupancy?.total || 0}`}
                  icon={Bed}
                  color="text-blue-600"
                />
                
                <StatCard
                  title={i18n.t('admin.revenue_today')}
                  value={`${dashboardStats?.revenue?.total || 0}€`}
                  icon={Euro}
                  color="text-green-500"
                />
                
                <StatCard
                  title={i18n.t('admin.pending_checkins')}
                  value={dashboardStats?.compliance?.pendingSubmissions || 0}
                  icon={Clock}
                  color="text-yellow-500"
                />
                
                <StatCard
                  title={i18n.t('admin.compliance_rate')}
                  value={`${dashboardStats?.compliance?.successRate || 0}%`}
                  icon={Shield}
                  color="text-green-500"
                />
              </div>

              {/* Recent Registrations */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="w-5 h-5 mr-2" />
                    {i18n.t('admin.recent_registrations')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {bookingsLoading ? (
                    <div className="text-center py-4">Loading recent bookings...</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-3 px-4 font-medium text-gray-700">
                              {i18n.t('admin.pilgrim')}
                            </th>
                            <th className="text-left py-3 px-4 font-medium text-gray-700">
                              {i18n.t('admin.document')}
                            </th>
                            <th className="text-left py-3 px-4 font-medium text-gray-700">
                              {i18n.t('admin.bed')}
                            </th>
                            <th className="text-left py-3 px-4 font-medium text-gray-700">
                              {i18n.t('admin.status')}
                            </th>
                            <th className="text-left py-3 px-4 font-medium text-gray-700">
                              {i18n.t('admin.actions')}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentBookings?.length > 0 ? (
                            recentBookings.map((booking: any) => (
                              <tr key={booking.id} className="border-b border-gray-100">
                                <td className="py-3 px-4">
                                  <div>
                                    <div className="font-medium text-gray-900">
                                      {booking.pilgrim?.firstName} {booking.pilgrim?.lastName1}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {booking.pilgrim?.addressCountry}
                                    </div>
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-sm text-gray-900">
                                  {booking.pilgrim?.documentNumber}
                                </td>
                                <td className="py-3 px-4 text-sm text-gray-900">
                                  {booking.bedAssignmentId ? `Bed ${booking.bedAssignmentId}` : 'Pending'}
                                </td>
                                <td className="py-3 px-4">
                                  <Badge variant={
                                    booking.status === 'confirmed' ? 'default' :
                                    booking.status === 'checked_in' ? 'secondary' :
                                    'destructive'
                                  }>
                                    {booking.status}
                                  </Badge>
                                </td>
                                <td className="py-3 px-4">
                                  <Button variant="link" size="sm">
                                    {i18n.t('admin.view_details')}
                                  </Button>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={5} className="text-center py-8 text-gray-500">
                                No recent bookings found
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'beds' && <BedManager />}
          
          {activeTab === 'payments' && (
            <div className="space-y-6">
              <h3 className="text-2xl font-semibold text-gray-900">
                {i18n.t('admin.payments')}
              </h3>
              
              <Card>
                <CardContent className="p-6">
                  <div className="text-center py-8 text-gray-500">
                    Payment management functionality coming soon...
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
