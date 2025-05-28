'use client';

import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Athletes } from '@/schemas';
import React from 'react';
import { AthleteTable } from './components';
import { Heading } from '@/components/ui/heading';

interface IProps {
  data: Athletes;
}

export const AthleteListScene = ({ data }: IProps) => {
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
              <Heading as="h1">
                Athletes
              </Heading>
            </div>
            <div className="flex flex-col gap-4 md:gap-6">
              <AthleteTable data={data} />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};
