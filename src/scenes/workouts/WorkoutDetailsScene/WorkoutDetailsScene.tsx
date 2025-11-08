'use client';

import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { Button } from '@/components/ui/button';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { formatDuration } from '@/lib/formatters';
import { routes } from '@/lib/routes';
import { Workout } from '@/schemas';
import React, { useState } from 'react';
import { WorkoutForm } from '../WorkoutCreateScene/components';

interface WorkoutDetailsSceneProps {
  workout: Workout;
  onSubmit: (data: Workout) => void;
}

export const WorkoutDetailsScene = ({
  workout,
  onSubmit: handleSubmit,
}: WorkoutDetailsSceneProps) => {
  const [isEditing, setIsEditing] = useState(false);
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
            { label: 'Workouts', href: routes.workouts.list() },
            { label: workout.description },
          ]}
        />

        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex justify-center gap-4 py-4 md:gap-6 md:py-6">
              <div className="w-full md:w-1/3 p-4">
                <div className="flex justify-between items-center flex-col md:flex-row mb-4">
                  <h1 className="text-2xl font-bold">{workout.description}</h1>
                  {!isEditing && (
                    <div>
                      <Button
                        variant="link"
                        onClick={() => {
                          setIsEditing(!isEditing);
                        }}
                      >
                        Edit
                      </Button>
                    </div>
                  )}
                </div>
                {!isEditing && (
                  <div className="space-y-4">
                    <p>
                      <strong>Start Date:</strong>{' '}
                      {new Date(workout.startDate).toLocaleDateString()}
                    </p>
                    {workout.duration && (
                      <p>
                        <strong>Duration:</strong>{' '}
                        {formatDuration(workout.duration)}
                      </p>
                    )}
                    {workout.modifiedDescription && (
                      <p>
                        <strong>Modified Description:</strong>{' '}
                        {workout.modifiedDescription}
                      </p>
                    )}
                  </div>
                )}
                {!!isEditing && (
                  <WorkoutForm
                    onCancel={() => setIsEditing(false)}
                    onSubmit={async (value) => {
                      await handleSubmit({
                        ...workout,
                        ...value,
                      });
                      setIsEditing(false);
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};
