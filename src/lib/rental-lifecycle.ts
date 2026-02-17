// Shared rental lifecycle utilities
// Used by both admin dashboard and jobs page

// ─── Job Interface (shared) ────────────────────────────────────────
export interface Job {
  id: number;
  jobType: 'delivery' | 'pickup' | 'swap' | 'service';
  bookingId: number | null;
  serviceResponseId: number | null;
  swapRequestId: number | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  address: string;
  city: string;
  zipCode: string;
  placementInstructions: string | null;
  scheduledDate: string;
  timePreference: string | null;
  dumpsterId: number | null;
  assignedFleetUnitId: number | null;
  status: string; // expanded: pending, scheduled, en_route, picked_up, dumping, completed, cancelled
  priority: number;
  notes: string | null;
  adminNotes: string | null;
  rentalEndDate: string | null;
  bookingDeliveryDate: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  dumpster: {
    id: number;
    name: string;
    dimensions: string;
  } | null;
  fleetUnit: {
    id: number;
    unitNumber: string;
    status: string;
  } | null;
  serviceName: string | null;
}

// ─── Rental Lifecycle Types ────────────────────────────────────────
export type RentalLifecycleStatus =
  | 'pending_dropoff'       // delivery pending
  | 'dropoff_scheduled'     // delivery scheduled
  | 'dropoff_en_route'      // delivery en_route
  | 'rental_active'         // delivery completed, pickup pending/scheduled
  | 'pickup_en_route'       // pickup en_route
  | 'picked_up'             // pickup picked_up — dumpster loaded on truck
  | 'dumping'               // pickup dumping — at dump site
  | 'completed'             // pickup completed — returned to hub/next customer
  | 'cancelled';

export interface RentalGroup {
  kind: 'rental';
  bookingId: number;
  deliveryJob: Job;
  pickupJob: Job;
  lifecycleStatus: RentalLifecycleStatus;
}

export interface SingleJob {
  kind: 'single';
  job: Job;
}

export type DisplayItem = RentalGroup | SingleJob;

// ─── Lifecycle Status Config (colors & labels) ────────────────────
export const lifecycleConfig: Record<RentalLifecycleStatus, { label: string; color: string; description: string }> = {
  pending_dropoff: { label: 'Pending Drop-off', color: 'bg-yellow-100 text-yellow-800', description: 'Awaiting drop-off' },
  dropoff_scheduled: { label: 'Drop-off Scheduled', color: 'bg-blue-100 text-blue-800', description: 'Drop-off scheduled' },
  dropoff_en_route: { label: 'En Route (Drop-off)', color: 'bg-sky-100 text-sky-800', description: 'Driver en route for drop-off' },
  rental_active: { label: 'Rental Active', color: 'bg-green-100 text-green-800', description: 'Dumpster on-site' },
  pickup_en_route: { label: 'En Route (Pick-up)', color: 'bg-orange-100 text-orange-800', description: 'Driver en route for pick-up' },
  picked_up: { label: 'Picked Up', color: 'bg-purple-100 text-purple-800', description: 'Dumpster loaded on truck' },
  dumping: { label: 'Dump / Load', color: 'bg-amber-100 text-amber-800', description: 'At dump site — processing load' },
  completed: { label: 'Completed', color: 'bg-gray-100 text-gray-700', description: 'Rental complete' },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800', description: 'Rental cancelled' },
};

// ─── 8-Step Lifecycle Stepper ──────────────────────────────────────
export const rentalLifecycleSteps = [
  { key: 'pending_dropoff', label: 'Pending', sublabel: 'Drop-off', step: 1 },
  { key: 'dropoff_scheduled', label: 'Scheduled', sublabel: 'Drop-off', step: 2 },
  { key: 'dropoff_en_route', label: 'En Route', sublabel: 'Drop-off', step: 3 },
  { key: 'rental_active', label: 'On-Site', sublabel: 'Active', step: 4 },
  { key: 'pickup_en_route', label: 'En Route', sublabel: 'Pick-up', step: 5 },
  { key: 'picked_up', label: 'Picked Up', sublabel: 'Loaded', step: 6 },
  { key: 'dumping', label: 'Dump/Load', sublabel: 'Processing', step: 7 },
  { key: 'completed', label: 'Done', sublabel: 'Complete', step: 8 },
];

// ─── Status Derivation ────────────────────────────────────────────
export function deriveLifecycleStatus(delivery: Job, pickup: Job): RentalLifecycleStatus {
  if (delivery.status === 'cancelled' || pickup.status === 'cancelled') return 'cancelled';
  if (delivery.status === 'pending') return 'pending_dropoff';
  if (delivery.status === 'scheduled') return 'dropoff_scheduled';
  if (delivery.status === 'en_route') return 'dropoff_en_route';
  // delivery completed — check pickup status
  if (pickup.status === 'dumping') return 'dumping';
  if (pickup.status === 'picked_up') return 'picked_up';
  if (pickup.status === 'en_route') return 'pickup_en_route';
  if (pickup.status === 'completed') return 'completed';
  // pickup pending or scheduled — dumpster is on-site
  return 'rental_active';
}

export function getActiveJob(group: RentalGroup): Job {
  if (group.deliveryJob.status !== 'completed') return group.deliveryJob;
  return group.pickupJob;
}

// ─── Step Number (for progress bar) ───────────────────────────────
export function getRentalStepNumber(rental: RentalGroup): number {
  const d = rental.deliveryJob.status;
  const p = rental.pickupJob.status;
  if (d === 'cancelled' || p === 'cancelled') return 0;
  if (d === 'pending') return 1;
  if (d === 'scheduled') return 2;
  if (d === 'en_route') return 3;
  // delivery completed — on-site or beyond
  if (p === 'completed') return 8;
  if (p === 'dumping') return 7;
  if (p === 'picked_up') return 6;
  if (p === 'en_route') return 5;
  return 4; // rental_active (pickup pending/scheduled)
}

// ─── Next Action (advance button) ─────────────────────────────────
export function getNextRentalAction(rental: RentalGroup): { label: string; jobId: number; newStatus: string } | null {
  const d = rental.deliveryJob;
  const p = rental.pickupJob;
  if (d.status === 'pending') return { label: 'Mark as Scheduled', jobId: d.id, newStatus: 'scheduled' };
  if (d.status === 'scheduled') return { label: 'Start Drop-off', jobId: d.id, newStatus: 'en_route' };
  if (d.status === 'en_route') return { label: 'Complete Drop-off', jobId: d.id, newStatus: 'completed' };
  // delivery completed
  if (p.status === 'pending' || p.status === 'scheduled') return { label: 'Start Pick-up', jobId: p.id, newStatus: 'en_route' };
  if (p.status === 'en_route') return { label: 'Mark Picked Up', jobId: p.id, newStatus: 'picked_up' };
  if (p.status === 'picked_up') return { label: 'Start Dump/Load', jobId: p.id, newStatus: 'dumping' };
  if (p.status === 'dumping') return { label: 'Complete & Return', jobId: p.id, newStatus: 'completed' };
  return null; // both completed
}

// ─── Override / Go-Back Actions ───────────────────────────────────
export function getRentalOverrideActions(rental: RentalGroup): { label: string; value: string }[] {
  const d = rental.deliveryJob;
  const p = rental.pickupJob;
  const actions: { label: string; value: string }[] = [];

  // Go-back options based on current state
  if (d.status === 'scheduled') {
    actions.push({ label: '← Back to Pending', value: `${d.id}:pending` });
  }
  if (d.status === 'en_route') {
    actions.push({ label: '← Back to Scheduled', value: `${d.id}:scheduled` });
  }
  if (d.status === 'completed' && (p.status === 'pending' || p.status === 'scheduled')) {
    actions.push({ label: '← Undo Drop-off', value: `${d.id}:en_route` });
  }
  if (p.status === 'en_route') {
    actions.push({ label: '← Undo Pick-up Start', value: `${p.id}:scheduled` });
  }
  if (p.status === 'picked_up') {
    actions.push({ label: '← Back to En Route', value: `${p.id}:en_route` });
  }
  if (p.status === 'dumping') {
    actions.push({ label: '← Back to Picked Up', value: `${p.id}:picked_up` });
  }
  if (p.status === 'completed') {
    actions.push({ label: '← Undo Completion', value: `${p.id}:dumping` });
  }

  // Cancel option — always available unless already cancelled or fully completed
  if (d.status !== 'cancelled' && !(d.status === 'completed' && p.status === 'completed')) {
    actions.push({ label: 'Cancel Rental', value: `cancel` });
  }

  return actions;
}

// ─── Job Status Config (for single jobs) ──────────────────────────
export const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  scheduled: { label: 'Scheduled', color: 'bg-blue-100 text-blue-800' },
  en_route: { label: 'En Route', color: 'bg-sky-100 text-sky-800' },
  picked_up: { label: 'Picked Up', color: 'bg-purple-100 text-purple-800' },
  dumping: { label: 'Dump/Load', color: 'bg-amber-100 text-amber-800' },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800' },
  // Legacy status (for existing data)
  in_progress: { label: 'In Progress', color: 'bg-orange-100 text-orange-800' },
};

// ─── Grouping Logic ───────────────────────────────────────────────
export function groupJobsIntoDisplayItems(allJobs: Job[]): DisplayItem[] {
  const bookingMap = new Map<number, { delivery?: Job; pickup?: Job }>();
  const singles: SingleJob[] = [];

  for (const job of allJobs) {
    // Service/swap jobs or jobs without bookingId are singles
    if (!job.bookingId || (job.jobType !== 'delivery' && job.jobType !== 'pickup')) {
      singles.push({ kind: 'single', job });
      continue;
    }

    if (!bookingMap.has(job.bookingId)) {
      bookingMap.set(job.bookingId, {});
    }
    const entry = bookingMap.get(job.bookingId)!;
    if (job.jobType === 'delivery') entry.delivery = job;
    if (job.jobType === 'pickup') entry.pickup = job;
  }

  const displayItems: DisplayItem[] = [];

  for (const [bookingId, { delivery, pickup }] of Array.from(bookingMap)) {
    if (delivery && pickup) {
      displayItems.push({
        kind: 'rental',
        bookingId,
        deliveryJob: delivery,
        pickupJob: pickup,
        lifecycleStatus: deriveLifecycleStatus(delivery, pickup),
      });
    } else {
      // Orphaned — only one of the pair exists
      if (delivery) singles.push({ kind: 'single', job: delivery });
      if (pickup) singles.push({ kind: 'single', job: pickup });
    }
  }

  displayItems.push(...singles);
  return displayItems;
}
