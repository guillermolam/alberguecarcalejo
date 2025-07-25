import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAdminStore } from '../store/adminStore';
import { BedMap } from '../components/BedMap';
import { NotificationBadge } from '../components/NotificationBadge';

export const AdminDashboard: React.FC = () => {
  const { metrics, isLoading } = useAdminStore();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Albergue Dashboard</h1>
          <p className="text-muted-foreground">Gestión del Albergue del Carrascalejo</p>
        </div>
        <div className="flex items-center gap-4">
          <NotificationBadge />
          <Button variant="outline">Exportar Datos</Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ocupación Hoy</CardTitle>
            <Badge variant="secondary">Live</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.occupancy || 0}%</div>
            <p className="text-xs text-muted-foreground">
              {metrics?.occupied_beds || 0} de {metrics?.total_beds || 24} camas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Mensuales</CardTitle>
            <Badge variant="outline">€</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{metrics?.monthly_revenue || 0}</div>
            <p className="text-xs text-muted-foreground">
              +{metrics?.revenue_growth || 0}% vs mes anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Check-ins Hoy</CardTitle>
            <Badge variant="default">Nuevos</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.checkins_today || 0}</div>
            <p className="text-xs text-muted-foreground">
              {metrics?.pending_checkins || 0} pendientes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Peregrinos Activos</CardTitle>
            <Badge variant="secondary">Total</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.active_pilgrims || 0}</div>
            <p className="text-xs text-muted-foreground">
              {metrics?.nationalities || 0} nacionalidades
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="bookings">Reservas</TabsTrigger>
          <TabsTrigger value="beds">Mapa de Camas</TabsTrigger>
          <TabsTrigger value="payments">Pagos</TabsTrigger>
          <TabsTrigger value="logs">Registros</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Ocupación Semanal</CardTitle>
                <CardDescription>Últimos 7 días</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Chart would go here - simplified for now */}
                <div className="h-64 flex items-center justify-center bg-muted rounded">
                  <p className="text-muted-foreground">Gráfico de ocupación</p>
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Próximas Llegadas</CardTitle>
                <CardDescription>Hoy y mañana</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">María González</p>
                      <p className="text-xs text-muted-foreground">DNI: 12345678A</p>
                    </div>
                    <Badge>Confirmada</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">John Smith</p>
                      <p className="text-xs text-muted-foreground">Pasaporte: AB123456</p>
                    </div>
                    <Badge variant="outline">Pendiente</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="bookings">
          <Card>
            <CardHeader>
              <CardTitle>Gestión de Reservas</CardTitle>
              <CardDescription>Todas las reservas del sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground">Tabla de reservas se implementará aquí</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="beds">
          <Card>
            <CardHeader>
              <CardTitle>Mapa de Camas</CardTitle>
              <CardDescription>Estado actual de todas las camas</CardDescription>
            </CardHeader>
            <CardContent>
              <BedMap />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>Gestión de Pagos</CardTitle>
              <CardDescription>Pagos en efectivo y online</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground">Panel de pagos se implementará aquí</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>Registros del Sistema</CardTitle>
              <CardDescription>Logs de seguridad y auditoría</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground">Logs del sistema se mostrarán aquí</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};