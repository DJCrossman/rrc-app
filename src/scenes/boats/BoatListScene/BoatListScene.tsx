'use client';

import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Boats } from '@/schemas';
import { default as React } from 'react';
import { BoatTable } from './components';
import { Heading } from '@/components/ui/heading';

interface IProps {
  data: Boats;
}

export const BoatListScene = ({ data }: IProps) => {
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
        <SiteHeader breadcrumbs={[{ label: 'Boats' }]} />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex items-center justify-between p-4 lg:px-6">
              <Heading as="h1">
                Boats
              </Heading>
            </div>
            <div className="flex flex-col gap-4 md:gap-6">
              <BoatTable data={data} />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};
