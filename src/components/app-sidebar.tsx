'use client';

import {
  IconCamera,
  IconChartBar,
  IconDashboard,
  IconDatabase,
  IconFileAi,
  IconFileDescription,
  IconFileWord,
  IconFolder,
  IconHelp,
  IconListDetails,
  IconReport,
  IconSailboat2,
  IconSearch,
  IconSettings,
  IconUsers,
} from '@tabler/icons-react';
import * as React from 'react';

import { NavDocuments } from '@/components/nav-documents';
import { NavMain } from '@/components/nav-main';
import { NavSecondary } from '@/components/nav-secondary';
import { NavUser } from '@/components/nav-user';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import Image from 'next/image';

const data = {
  user: {
    name: 'David',
    phone: '1 (306) 550 - 6678',
    avatar: '/avatars/shadcn.jpg',
  },
  navMain: [
    {
      title: 'Dashboard',
      url: '#',
      icon: IconDashboard,
    },
    {
      title: 'Programs',
      url: '#',
      icon: IconListDetails,
    },
    {
      title: 'Boats',
      url: '#',
      icon: IconSailboat2,
    },
    {
      title: 'Training Plans',
      url: '#',
      icon: IconFolder,
    },
    {
      title: 'Rowers',
      url: '#',
      icon: IconUsers,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a
                href={process.env.NEXT_PUBLIC_HOME_URL}
                className="flex items-center gap-2 font-medium"
              >
                <Image
                  src="/logo.png"
                  alt="Regina Rowing Club Logo"
                  width={24}
                  height={24}
                />
                <span className="text-base font-semibold">
                  Reging Rowing Club
                </span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
