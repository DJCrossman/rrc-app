'use client';

import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { Heading } from '@/components/ui/heading';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { useNavigate } from '@/hooks/useNavigate';
import { routes } from '@/lib/routes';
import { Activities, Athlete, Athletes, CreateAthlete } from '@/schemas';
import React from 'react';
import { AthleteCreateDrawer, AthleteDetailsDrawer, AthleteTable } from './components';

interface IProps {
  data: Athletes;
  selectedAthlete: Athlete | null;
  activities?: Activities;
  isCreateDrawerOpen: boolean;
  onCreateAthlete: (data: CreateAthlete) => Promise<void> | void;
  onUpdateAthlete: (data: Athlete) => Promise<void> | void;
}

export const AthleteListScene = ({
  data,
  selectedAthlete,
  activities = [],
  isCreateDrawerOpen,
  onCreateAthlete,
  onUpdateAthlete,
}: IProps) => {
  const router = useNavigate();

  return (
    <SidebarProvider
      style={
        {
          '--sidebar-width': 'calc(var(--spacing) * 72)',
          '--header-height': 'calc(var(--spacing) * 12)',
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader breadcrumbs={[{ label: 'Athletes' }]} />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex items-center justify-between p-4 lg:px-6">
              <Heading as="h1">Athletes</Heading>
            </div>
            <div className="flex flex-col gap-4 md:gap-6">
              <AthleteTable
                data={data}
              />
            </div>
          </div>
        </div>
      </SidebarInset>
      <AthleteCreateDrawer
        isOpen={isCreateDrawerOpen}
        onSubmit={onCreateAthlete}
        onClose={() => router.push(routes.athletes.list())}
      />
      <AthleteDetailsDrawer
        isOpen={!!selectedAthlete}
        athlete={selectedAthlete}
        activities={activities}
        onSubmit={onUpdateAthlete}
        onClose={() => router.push(routes.athletes.list())}
      />
    </SidebarProvider>
  );
};
