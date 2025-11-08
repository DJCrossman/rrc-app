'use client';

import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Ergs } from '@/schemas';
import { default as React } from 'react';
import { ErgTable } from './components';
import { Heading } from '@/components/ui/heading';

interface IProps {
  data: Ergs;
}

export const ErgListScene = ({ data }: IProps) => {
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
        <SiteHeader breadcrumbs={[{ label: 'ERGs' }]} />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex items-center justify-between p-4 lg:px-6">
              <Heading as="h1">
                ERGs
              </Heading>
            </div>
            <div className="flex flex-col gap-4 md:gap-6">
              <ErgTable data={data} />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};