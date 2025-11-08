'use client';

import { ActivityTable } from '@/components/activities';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { Button } from '@/components/ui/button';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { formatMeters } from '@/lib/formatters';
import { routes } from '@/lib/routes';
import { Activities, CreateErg, Erg } from '@/schemas';
import { IconPencil } from '@tabler/icons-react';
import React, { useState } from 'react';
import { ErgForm } from '../ErgCreateScene/components';

interface ErgDetailsSceneProps {
  erg: Erg;
  activities: Activities;
  onSubmit: (data: Erg) => void;
}

export const ErgDetailsScene = ({
  erg,
  activities,
  onSubmit: handleSubmit,
}: ErgDetailsSceneProps) => {
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
            { label: 'ERGs', href: routes.ergs.list() },
            { label: erg.name },
          ]}
        />

        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex justify-center gap-4 py-4 md:gap-6 md:py-6">
              <div className="w-full md:w-1/3 p-4">
                <div className="flex justify-between items-center flex-col md:flex-row mb-4">
                  <h1 className="text-2xl font-bold">{erg.name}</h1>
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
                      <strong>Manufacturer:</strong>{' '}
                      {erg.manufacturer.toUpperCase()}
                    </p>
                    <p>
                      <strong>Serial Number:</strong>{' '}
                      {erg.serialNumber || 'Not specified'}
                    </p>
                    <p>
                      <strong>Firmware Version:</strong>{' '}
                      {erg.firmwareVersion || 'Not specified'}
                    </p>
                    <p>
                      <strong>Hardware Version:</strong>{' '}
                      {erg.hardwareVersion || 'Not specified'}
                    </p>
                    <p>
                      <strong>Data Code:</strong>{' '}
                      {erg.dataCode || 'Not specified'}
                    </p>
                    <p>
                      <strong>Total Meters:</strong> {formatMeters(erg.meters)}
                    </p>
                  </div>
                )}
                {isEditing && (
                  <ErgForm
                    defaultValues={{
                      name: erg.name,
                      manufacturer: erg.manufacturer,
                      serialNumber: erg.serialNumber,
                      firmwareVersion: erg.firmwareVersion,
                      hardwareVersion: erg.hardwareVersion,
                      dataCode: erg.dataCode,
                    }}
                    onSubmit={(data: CreateErg) => {
                      handleSubmit({
                        ...erg,
                        ...data,
                      });
                      setIsEditing(false);
                    }}
                    onCancel={() => setIsEditing(false)}
                  />
                )}
              </div>
            </div>

            {activities?.length > 0 && (
              <div className="p-4 lg:px-6">
                <h2 className="text-xl font-semibold mb-4">Activity History</h2>
                <ActivityTable data={activities} />
              </div>
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};
