'use client';

import {
  IconDashboard,
  IconFolder,
  IconSailboat2,
  IconUsers
} from '@tabler/icons-react';
import * as React from 'react';

import { NavMain } from '@/components/nav-main';
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
      url: '/',
      icon: IconDashboard,
    },
    {
      title: 'Boats',
      url: '/boats',
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
