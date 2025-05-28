'use client';

import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { routes } from '@/lib/routes';
import { WorkoutForm } from './components';
import { CreateWorkout } from '@/schemas';
import React from 'react';

interface WorkoutCreateSceneProps {
  onSubmit: (data: CreateWorkout) => void;
}

export const WorkoutCreateScene = ({ onSubmit }: WorkoutCreateSceneProps) => {
  return (
    <SidebarProvider
      style={{
        '--sidebar-width': 'calc(var(--spacing) * 72)',
        '--header-height': 'calc(var(--spacing) * 12)',
      }}
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader
          breadcrumbs={[
            { label: 'Workouts', href: routes.workouts.list() },
            { label: 'Create Workout' },
          ]}
        />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex justify-center gap-4 py-4 md:gap-6 md:py-6">
              <div className="w-full md:w-1/3 p-4">
                <h1 className="text-2xl font-bold mb-4">Create a New Workout</h1>
                <WorkoutForm
                  onCancel={routes.workouts.list()}
                  onSubmit={onSubmit}
                />
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};