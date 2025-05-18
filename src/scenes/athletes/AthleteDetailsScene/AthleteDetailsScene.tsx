'use client';

import { ActivityTable } from '@/components/activities';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { Button } from '@/components/ui/button';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { formatProgram } from '@/lib/formatters';
import { routes } from '@/lib/routes';
import { Activities, Athlete } from '@/schemas';
import { IconPencil } from '@tabler/icons-react';
import React, { useState } from 'react';
import { AthleteForm } from '../AthleteCreateScene/components/AthleteForm/AthleteForm';

interface AthleteDetailsSceneProps {
  athlete: Athlete;
  activities: Activities;
  onSubmit: (data: Athlete) => void;
}

export const AthleteDetailsScene = ({
  athlete,
  activities,
  onSubmit: handleSubmit,
}: AthleteDetailsSceneProps) => {
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
            { label: 'Athletes', href: routes.athletes.list() },
            { label: athlete.name },
          ]}
        />

        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex justify-center gap-4 py-4 md:gap-6 md:py-6">
              <div className="w-full md:w-1/3 p-4">
                <div className="flex justify-between items-center flex-col md:flex-row mb-4">
                  <h1 className="text-2xl font-bold">{athlete.name}</h1>
                  {!isEditing && (
                    <div>
                      <Button
                        variant="link"
                        onClick={() => {
                          setIsEditing(!isEditing);
                        }}
                      >
                        <IconPencil size={16} />
                        Edit
                      </Button>
                    </div>
                  )}
                </div>
                {!isEditing && (
                  <div className="space-y-4">
                    <p>
                      <strong>Program:</strong> {formatProgram(athlete.program)}
                    </p>
                  </div>
                )}
                {!!isEditing && (
                  <AthleteForm
                    onCancel={() => setIsEditing(false)}
                    onSubmit={async (value) => {
                      await handleSubmit({
                        ...athlete,
                        ...value,
                      });
                      setIsEditing(false);
                    }}
                  />
                )}
              </div>
            </div>
            <hr className="mx-auto w-[80%]" />
            <div className="flex justify-center gap-4 py-4 md:gap-6 md:py-6">
              <div className="w-full md:w-2/3 p-4">
                <ActivityTable
                  data={activities}
                  showColumns={[
                    'startDate',
                    'name',
                    'boat.name',
                    'isStrava',
                    'distance',
                  ]}
                />
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};
