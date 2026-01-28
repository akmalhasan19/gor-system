import { supabase } from '../supabase';

export interface MaintenanceTask {
    id: string;
    venueId: string;
    courtId: string;
    taskDate: string;
    startHour: number;
    durationHours: number;
    maintenanceType: string;
    status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
    technicianName?: string;
    cost?: number;
    notes?: string;
    createdAt?: string;
    updatedAt?: string;
}

export const MAINTENANCE_TYPES = [
    { id: 'floor_wax', label: 'Pelapisan Lantai' },
    { id: 'net_replace', label: 'Ganti Net' },
    { id: 'lighting', label: 'Perbaikan Lampu' },
    { id: 'cleaning', label: 'Pembersihan Mendalam' },
    { id: 'repair', label: 'Perbaikan Umum' },
    { id: 'other', label: 'Lainnya' },
];

/**
 * Get maintenance tasks for a venue on a specific date
 */
export async function getMaintenanceTasks(
    venueId: string,
    date: string
): Promise<MaintenanceTask[]> {
    const { data, error } = await supabase
        .from('maintenance_tasks')
        .select('*')
        .eq('venue_id', venueId)
        .eq('task_date', date)
        .neq('status', 'cancelled')
        .order('start_hour', { ascending: true });

    if (error) throw error;

    return (data || []).map(row => ({
        id: row.id,
        venueId: row.venue_id,
        courtId: row.court_id,
        taskDate: row.task_date,
        startHour: row.start_hour,
        durationHours: row.duration_hours,
        maintenanceType: row.maintenance_type,
        status: row.status,
        technicianName: row.technician_name,
        cost: row.cost ? Number(row.cost) : undefined,
        notes: row.notes,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    }));
}

/**
 * Get all maintenance tasks for a venue (for history/settings)
 */
export async function getMaintenanceHistory(
    venueId: string,
    limit: number = 50
): Promise<MaintenanceTask[]> {
    const { data, error } = await supabase
        .from('maintenance_tasks')
        .select('*')
        .eq('venue_id', venueId)
        .order('task_date', { ascending: false })
        .order('start_hour', { ascending: true })
        .limit(limit);

    if (error) throw error;

    return (data || []).map(row => ({
        id: row.id,
        venueId: row.venue_id,
        courtId: row.court_id,
        taskDate: row.task_date,
        startHour: row.start_hour,
        durationHours: row.duration_hours,
        maintenanceType: row.maintenance_type,
        status: row.status,
        technicianName: row.technician_name,
        cost: row.cost ? Number(row.cost) : undefined,
        notes: row.notes,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    }));
}

/**
 * Create a new maintenance task
 */
export async function createMaintenanceTask(
    task: Omit<MaintenanceTask, 'id' | 'createdAt' | 'updatedAt'>
): Promise<MaintenanceTask> {
    const { data, error } = await supabase
        .from('maintenance_tasks')
        .insert({
            venue_id: task.venueId,
            court_id: task.courtId,
            task_date: task.taskDate,
            start_hour: task.startHour,
            duration_hours: task.durationHours,
            maintenance_type: task.maintenanceType,
            status: task.status || 'scheduled',
            technician_name: task.technicianName,
            cost: task.cost,
            notes: task.notes,
        })
        .select()
        .single();

    if (error) throw error;

    return {
        id: data.id,
        venueId: data.venue_id,
        courtId: data.court_id,
        taskDate: data.task_date,
        startHour: data.start_hour,
        durationHours: data.duration_hours,
        maintenanceType: data.maintenance_type,
        status: data.status,
        technicianName: data.technician_name,
        cost: data.cost ? Number(data.cost) : undefined,
        notes: data.notes,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
    };
}

/**
 * Update a maintenance task
 */
export async function updateMaintenanceTask(
    id: string,
    updates: Partial<Omit<MaintenanceTask, 'id' | 'venueId' | 'createdAt' | 'updatedAt'>>
): Promise<void> {
    const dbUpdates: Record<string, unknown> = {};

    if (updates.courtId !== undefined) dbUpdates.court_id = updates.courtId;
    if (updates.taskDate !== undefined) dbUpdates.task_date = updates.taskDate;
    if (updates.startHour !== undefined) dbUpdates.start_hour = updates.startHour;
    if (updates.durationHours !== undefined) dbUpdates.duration_hours = updates.durationHours;
    if (updates.maintenanceType !== undefined) dbUpdates.maintenance_type = updates.maintenanceType;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.technicianName !== undefined) dbUpdates.technician_name = updates.technicianName;
    if (updates.cost !== undefined) dbUpdates.cost = updates.cost;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes;

    const { error } = await supabase
        .from('maintenance_tasks')
        .update(dbUpdates)
        .eq('id', id);

    if (error) throw error;
}

/**
 * Delete (cancel) a maintenance task
 */
export async function cancelMaintenanceTask(id: string): Promise<void> {
    const { error } = await supabase
        .from('maintenance_tasks')
        .update({ status: 'cancelled' })
        .eq('id', id);

    if (error) throw error;
}

/**
 * Check if a slot is blocked by maintenance
 */

export function isSlotBlockedByMaintenance(
    tasks: MaintenanceTask[],
    courtId: string,
    hour: number
): MaintenanceTask | undefined {
    return tasks.find(task => {
        if (task.courtId !== courtId) return false;
        const endHour = task.startHour + task.durationHours;
        return hour >= task.startHour && hour < endHour;
    });
}

// --- Recurring Schedule Types & Functions ---

export interface MaintenanceSchedule {
    id: string;
    venueId: string;
    courtId: string;
    title: string;
    frequencyDays: number;
    lastPerformedAt?: string; // YYYY-MM-DD
    nextDueDate: string; // YYYY-MM-DD
    isActive: boolean;
    costEstimate?: number;
    createdAt?: string;
    updatedAt?: string;
}

/**
 * Get all active maintenance schedules for a venue
 */
export async function getMaintenanceSchedules(
    venueId: string
): Promise<MaintenanceSchedule[]> {
    const { data, error } = await supabase
        .from('court_maintenance_schedules')
        .select('*')
        .eq('venue_id', venueId)
        .order('next_due_date', { ascending: true });

    if (error) throw error;

    return (data || []).map(row => ({
        id: row.id,
        venueId: row.venue_id,
        courtId: row.court_id,
        title: row.title,
        frequencyDays: row.frequency_days,
        lastPerformedAt: row.last_performed_at,
        nextDueDate: row.next_due_date,
        isActive: row.is_active,
        costEstimate: row.cost_estimate ? Number(row.cost_estimate) : undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    }));
}

/**
 * Create a new recurring maintenance schedule
 */
export async function createMaintenanceSchedule(
    schedule: Omit<MaintenanceSchedule, 'id' | 'createdAt' | 'updatedAt'>
): Promise<MaintenanceSchedule> {
    const { data, error } = await supabase
        .from('court_maintenance_schedules')
        .insert({
            venue_id: schedule.venueId,
            court_id: schedule.courtId,
            title: schedule.title,
            frequency_days: schedule.frequencyDays,
            last_performed_at: schedule.lastPerformedAt,
            next_due_date: schedule.nextDueDate,
            is_active: schedule.isActive,
            cost_estimate: schedule.costEstimate,
        })
        .select()
        .single();

    if (error) throw error;

    return {
        id: data.id,
        venueId: data.venue_id,
        courtId: data.court_id,
        title: data.title,
        frequencyDays: data.frequency_days,
        lastPerformedAt: data.last_performed_at,
        nextDueDate: data.next_due_date,
        isActive: data.is_active,
        costEstimate: data.cost_estimate ? Number(data.cost_estimate) : undefined,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
    };
}

/**
 * Update a maintenance schedule
 */
export async function updateMaintenanceSchedule(
    id: string,
    updates: Partial<Omit<MaintenanceSchedule, 'id' | 'venueId' | 'createdAt' | 'updatedAt'>>
): Promise<void> {
    const dbUpdates: Record<string, unknown> = {};

    if (updates.courtId !== undefined) dbUpdates.court_id = updates.courtId;
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.frequencyDays !== undefined) dbUpdates.frequency_days = updates.frequencyDays;
    if (updates.lastPerformedAt !== undefined) dbUpdates.last_performed_at = updates.lastPerformedAt;
    if (updates.nextDueDate !== undefined) dbUpdates.next_due_date = updates.nextDueDate;
    if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
    if (updates.costEstimate !== undefined) dbUpdates.cost_estimate = updates.costEstimate;

    const { error } = await supabase
        .from('court_maintenance_schedules')
        .update(dbUpdates)
        .eq('id', id);

    if (error) throw error;
}

/**
 * Delete a maintenance schedule
 */
export async function deleteMaintenanceSchedule(id: string): Promise<void> {
    const { error } = await supabase
        .from('court_maintenance_schedules')
        .delete()
        .eq('id', id);

    if (error) throw error;
}

/**
 * Complete a scheduled task:
 * 1. Create a record in maintenance_tasks
 * 2. Update last_performed_at and next_due_date in court_maintenance_schedules
 */
export async function completeScheduleTask(
    schedule: MaintenanceSchedule,
    completionDate: string,
    notes?: string
): Promise<void> {
    // 1. Create maintenance task history
    await createMaintenanceTask({
        venueId: schedule.venueId,
        courtId: schedule.courtId,
        taskDate: completionDate,
        startHour: 8, // Default to morning
        durationHours: 1, // Default duration
        maintenanceType: 'scheduled', // customized type
        status: 'completed',
        notes: `Rutin: ${schedule.title}. ${notes || ''}`,
        cost: schedule.costEstimate,
    });

    // 2. Calculate next due date
    const lastDate = new Date(completionDate);
    lastDate.setDate(lastDate.getDate() + schedule.frequencyDays);
    const nextDueDate = lastDate.toISOString().split('T')[0];

    // 3. Update schedule
    await updateMaintenanceSchedule(schedule.id, {
        lastPerformedAt: completionDate,
        nextDueDate: nextDueDate,
    });
}
