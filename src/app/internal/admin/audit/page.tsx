import { supabaseAdmin } from '@/lib/supabase-admin';

export default async function AdminAuditPage() {
    const { data: logs } = await supabaseAdmin
        .from('admin_audit_logs')
        .select('id, actor_user_id, actor_role, action_type, target_type, target_id, created_at')
        .order('created_at', { ascending: false })
        .limit(200);

    return (
        <div className="space-y-4">
            <div className="bg-white border-2 border-black p-4">
                <h2 className="text-xl font-black uppercase">Admin Audit Log</h2>
                <p className="text-sm text-gray-600">
                    Catatan aksi kritikal untuk provisioning, invite, dan lifecycle venue.
                </p>
            </div>

            <div className="bg-white border-2 border-black overflow-auto">
                <table className="w-full text-sm">
                    <thead className="bg-black text-white">
                        <tr>
                            <th className="p-2 text-left">Time</th>
                            <th className="p-2 text-left">Actor</th>
                            <th className="p-2 text-left">Action</th>
                            <th className="p-2 text-left">Target</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(logs || []).map((log) => (
                            <tr key={log.id} className="border-b border-gray-200">
                                <td className="p-2">{new Date(log.created_at).toLocaleString('id-ID')}</td>
                                <td className="p-2">
                                    <p>{log.actor_role}</p>
                                    <p className="text-xs text-gray-600">{log.actor_user_id}</p>
                                </td>
                                <td className="p-2">{log.action_type}</td>
                                <td className="p-2">
                                    <p>{log.target_type}</p>
                                    <p className="text-xs text-gray-600">{log.target_id}</p>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
