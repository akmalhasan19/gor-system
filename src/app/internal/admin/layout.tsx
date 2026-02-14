import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentPlatformAdminFromCookies } from '@/lib/admin-auth';

export default async function InternalAdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const admin = await getCurrentPlatformAdminFromCookies();
    if (!admin) {
        redirect('/dashboard');
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <header className="bg-black text-white p-4 border-b-4 border-brand-lime">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-black uppercase">Internal Admin Panel</h1>
                        <p className="text-xs uppercase text-gray-300">
                            {admin.user.email} - {admin.admin.role}
                        </p>
                    </div>
                    <Link href="/dashboard" className="text-sm font-bold underline">
                        Back to App
                    </Link>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
                <aside className="bg-white border-2 border-black p-3 h-fit">
                    <nav className="flex flex-col gap-2 text-sm font-bold uppercase">
                        <Link href="/internal/admin" className="border border-black p-2">Overview</Link>
                        <Link href="/internal/admin/leads" className="border border-black p-2">Leads</Link>
                        <Link href="/internal/admin/venues" className="border border-black p-2">Venues</Link>
                        <Link href="/internal/admin/audit" className="border border-black p-2">Audit Logs</Link>
                    </nav>
                </aside>

                <main>{children}</main>
            </div>
        </div>
    );
}
