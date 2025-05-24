'use client';

import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { routes } from '@/lib/routes';
import { CreateAthlete } from '@/schemas';
import React from 'react';
import { AthleteForm } from './components';

interface AthleteCreateSceneProps {
  onSubmit: (data: CreateAthlete) => void;
}

export const AthleteCreateScene = ({
  onSubmit: handleSubmit,
}: AthleteCreateSceneProps) => {
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
        <SiteHeader
          breadcrumbs={[
            { label: 'Athletes', href: routes.athletes.list() },
            { label: 'Create Athlete' },
          ]}
        />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex justify-center gap-4 py-4 md:gap-6 md:py-6">
              <div className="w-full md:w-1/3 p-4">
                <h1 className="text-2xl font-bold mb-4">Add an Athlete</h1>
                <AthleteForm
                  onCancel={routes.athletes.list()}
                  onSubmit={handleSubmit}
                />
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};
