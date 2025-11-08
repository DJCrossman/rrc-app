'use client';

import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { routes } from '@/lib/routes';
import { ErgForm } from '@/scenes/ergs/ErgCreateScene/components/ErgForm/ErgForm';
import { CreateErg } from '@/schemas';
import React from 'react';

interface ErgCreateSceneProps {
  onSubmit: (data: CreateErg) => void;
}

export const ErgCreateScene = ({
  onSubmit: handleSubmit,
}: ErgCreateSceneProps) => {
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
            { label: 'ERGs', href: routes.ergs.list() },
            { label: 'Create Erg' },
          ]}
        />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex justify-center gap-4 py-4 md:gap-6 md:py-6">
              <div className="w-full md:w-1/3 p-4">
                <h1 className="text-2xl font-bold mb-4">Create a New Erg</h1>
                <ErgForm
                  onSubmit={(data: CreateErg) => {
                    handleSubmit(data);
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};