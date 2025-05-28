'use client';

import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Workouts } from '@/schemas/workouts.schema';
import { WorkoutTable } from './WorkoutTable/WorkoutTable';
import { Heading } from '@/components/ui/heading';
import { routes } from '@/lib/routes';
import { IconPlus } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';

interface WorkoutListSceneProps {
  data: Workouts;
}

export const WorkoutListScene = ({ data }: WorkoutListSceneProps) => {
  return (
    <SidebarProvider
      style={{
        '--sidebar-width': 'calc(var(--spacing) * 72)',
        '--header-height': 'calc(var(--spacing) * 12)',
      }}
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader breadcrumbs={[{ label: 'Workouts' }]} />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex items-center justify-between p-4 lg:px-6">
              <Heading as="h1">
                Workouts
              </Heading>
              <div className="flex items-center gap-2">
                <Button asChild variant="outline" size="sm">
                  <a href={routes.workouts.create()}>
                    <IconPlus />
                    <span className="hidden lg:inline">Add Workout</span>
                  </a>
                </Button>
              </div>
            </div>
            <div className="flex flex-col gap-4 md:gap-6">
              <WorkoutTable data={data} />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};