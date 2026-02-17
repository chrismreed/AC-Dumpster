'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DumpsterTypesTab from '@/components/admin/dumpsters/dumpster-types-tab';
import FleetInventoryTab from '@/components/admin/dumpsters/fleet-inventory-tab';

export default function AdminDumpstersPage() {
  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto w-full min-w-0 pb-32">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3 sm:mb-6 min-w-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Dumpster Management</h1>
          <p className="text-sm text-gray-500 mt-0.5 hidden sm:block">Manage dumpster types and fleet inventory</p>
        </div>
      </div>

      <Tabs defaultValue="types" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="types">Types</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
        </TabsList>

        <TabsContent value="types" className="space-y-6">
          <DumpsterTypesTab />
        </TabsContent>

        <TabsContent value="inventory" className="space-y-6">
          <FleetInventoryTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
