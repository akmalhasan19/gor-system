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
