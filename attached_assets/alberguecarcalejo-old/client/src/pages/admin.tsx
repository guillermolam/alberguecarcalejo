import { useState, useEffect } from "react";
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
  Calendar,
  LogOut
} from "lucide-react";
import { useI18n } from "@/contexts/i18n-context";
import { auth0Service, Auth0User } from "@/lib/auth0";
import { useLocation } from "wouter";

export default function Admin() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [user, setUser] = useState<Auth0User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const { t } = useI18n();
  const [, navigate] = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Handle Auth0 callback if present
        if (window.location.search.includes('code=') && window.location.search.includes('state=')) {
          await auth0Service.handleRedirectCallback();
          window.history.replaceState({}, document.title, window.location.pathname);
        }
        
        const authenticated = await auth0Service.isAuthenticated();
        setIsAuthenticated(authenticated);
        
        if (authenticated) {
          const userData = await auth0Service.getUser();
          setUser(userData);
        } else {
          // Redirect to home if not authenticated
          navigate('/');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await auth0Service.logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Authentication required</p>
        </div>
      </div>
    );
  }

  const { data: dashboardStats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/dashboard/stats'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/dashboard/stats');
      return response.json();
    },
    enabled: isAuthenticated // Only fetch when authenticated
  });

  const { data: recentBookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ['/api/bookings/recent'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/bookings/recent');
      return response.json();
    },
    enabled: isAuthenticated // Only fetch when authenticated
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
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('loading.processing')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(45,50%,95%)]">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-gradient-to-b from-[hsl(75,35%,25%)] to-[hsl(75,35%,20%)] text-white min-h-screen">
          <div className="p-6">
            <h2 className="text-xl font-semibold font-title">{t('admin.title')}</h2>
            <div className="mt-4 pt-4 border-t border-white/20">
              <p className="text-sm text-blue-100">{t('auth.welcome')}</p>
              <p className="text-sm font-medium">{user?.name || user?.email}</p>
            </div>
          </div>
          
          <nav className="mt-6">
            <Button
              variant={activeTab === 'dashboard' ? 'secondary' : 'ghost'}
              className="w-full justify-start text-left px-6 py-3 text-blue-100 hover:bg-white/10 hover:text-white"
              onClick={() => setActiveTab('dashboard')}
            >
              <BarChart3 className="w-5 h-5 mr-3" />
              {t('admin.dashboard')}
            </Button>
            
            <Button
              variant={activeTab === 'beds' ? 'secondary' : 'ghost'}
              className="w-full justify-start text-left px-6 py-3 text-blue-100 hover:bg-white/10 hover:text-white"
              onClick={() => setActiveTab('beds')}
            >
              <Bed className="w-5 h-5 mr-3" />
              {t('admin.beds')}
            </Button>
            
            <Button
              variant={activeTab === 'payments' ? 'secondary' : 'ghost'}
              className="w-full justify-start text-left px-6 py-3 text-blue-100 hover:bg-white/10 hover:text-white"
              onClick={() => setActiveTab('payments')}
            >
              <Euro className="w-5 h-5 mr-3" />
              {t('admin.payments')}
            </Button>
            
            <div className="mt-8 pt-4 border-t border-white/20">
              <Button
                variant="ghost"
                className="w-full justify-start text-left px-6 py-3 text-blue-100 hover:bg-red-500/20 hover:text-red-200"
                onClick={handleLogout}
              >
                <LogOut className="w-5 h-5 mr-3" />
                {t('auth.logout')}
              </Button>
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <h3 className="text-2xl font-semibold text-gray-900 font-title">
                {t('admin.dashboard')}
              </h3>
              
              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard
                  title={t('admin.occupancy_today')}
                  value={`${dashboardStats?.occupancy?.occupied || 0}/${dashboardStats?.occupancy?.total || 0}`}
                  icon={Bed}
                  color="text-[hsl(75,35%,25%)]"
                />
                
                <StatCard
                  title={t('admin.revenue_today')}
                  value={`${dashboardStats?.revenue?.total || 0}€`}
                  icon={Euro}
                  color="text-[hsl(75,25%,55%)]"
                />
                
                <StatCard
                  title={t('admin.pending_checkins')}
                  value={dashboardStats?.compliance?.pendingSubmissions || 0}
                  icon={Clock}
                  color="text-[hsl(240,100%,50%)]"
                />
                
                <StatCard
                  title={t('admin.compliance_rate')}
                  value={`${dashboardStats?.compliance?.successRate || 0}%`}
                  icon={Shield}
                  color="text-[hsl(75,25%,55%)]"
                />
              </div>

              {/* Recent Registrations */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center font-title">
                    <Users className="w-5 h-5 mr-2" />
                    {t('admin.recent_registrations')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {bookingsLoading ? (
                    <div className="text-center py-4">{t('loading.processing')}</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-3 px-4 font-medium text-gray-700">
                              {t('admin.pilgrim')}
                            </th>
                            <th className="text-left py-3 px-4 font-medium text-gray-700">
                              {t('admin.document')}
                            </th>
                            <th className="text-left py-3 px-4 font-medium text-gray-700">
                              {t('admin.bed')}
                            </th>
                            <th className="text-left py-3 px-4 font-medium text-gray-700">
                              {t('admin.status')}
                            </th>
                            <th className="text-left py-3 px-4 font-medium text-gray-700">
                              {t('admin.actions')}
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
                                    {t('admin.view_details')}
                                  </Button>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={5} className="text-center py-8 text-gray-500">
                                {t('admin.no_bookings')}
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
              <h3 className="text-2xl font-semibold text-gray-900 font-title">
                {t('admin.payments')}
              </h3>
              
              <Card>
                <CardContent className="p-6">
                  <div className="text-center py-8 text-gray-500">
                    {t('admin.coming_soon')}
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
