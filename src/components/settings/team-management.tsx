"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useVenue } from '@/lib/venue-context';
import { useUserRole } from '@/hooks/use-role';
import { AppRole } from '@/types/role';
import { toast } from 'sonner';
import { Trash2, UserPlus, Shield, Check } from 'lucide-react';
import { NeoInput } from '@/components/ui/neo-input';

interface TeamMember {
    id: string; // user_venue id
    userId: string;
    role: AppRole;
    profile: {
        email: string;
        full_name: string;
        avatar_url: string;
    };
}

export const TeamManagement = () => {
    const { currentVenueId } = useVenue();
    const { role: currentUserRole } = useUserRole();
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [inviteEmail, setInviteEmail] = useState('');
    const [isInviting, setIsInviting] = useState(false);

    const isOwner = currentUserRole === 'owner';

    useEffect(() => {
        fetchMembers();
    }, [currentVenueId]);

    const fetchMembers = async () => {
        if (!currentVenueId) return;
        setIsLoading(true);
        try {
            // 1. Fetch user_venues first
            const { data: venueUsers, error: venueError } = await supabase
                .from('user_venues')
                .select('id, user_id, role')
                .eq('venue_id', currentVenueId);

            if (venueError) throw venueError;
            if (!venueUsers || venueUsers.length === 0) {
                setMembers([]);
                return;
            }

            const userIds = venueUsers.map(u => u.user_id);

            // 2. Fetch profiles manually to avoid Join issues if FK is missing or inferred incorrectly
            const { data: profiles, error: profileError } = await supabase
                .from('profiles')
                .select('id, email, full_name, avatar_url')
                .in('id', userIds);

            // If profiles table doesn't exist or error, we might get an error here.
            // But we can try to handle it.
            if (profileError) {
                console.warn('Could not fetch profiles (table might be missing):', profileError);
                // Fallback: Show "Unknown" but list the roles
                const membersWithoutProfile = venueUsers.map(vu => ({
                    id: vu.id,
                    userId: vu.user_id,
                    role: vu.role as AppRole,
                    profile: { email: 'Error loading profile', full_name: 'Unknown User', avatar_url: '' }
                }));
                setMembers(membersWithoutProfile);
                return;
            }

            // 3. Map them together
            const profileMap = new Map(profiles?.map(p => [p.id, p]));

            const validMembers = venueUsers.map(vu => {
                const profile = profileMap.get(vu.user_id);
                return {
                    id: vu.id,
                    userId: vu.user_id,
                    role: vu.role as AppRole,
                    profile: profile || { email: 'No Profile', full_name: 'Unknown User', avatar_url: '' }
                };
            });

            setMembers(validMembers);
        } catch (error) {
            console.error('Error fetching members:', error);
            // Don't toast error on initial load to avoid spamming if migration is missing
            // toast.error('Gagal memuat anggota tim.'); 
        } finally {
            setIsLoading(false);
        }
    };

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteEmail) return;
        if (!currentVenueId) return;

        setIsInviting(true);
        try {
            // 1. Find user by email
            const { data: profiles, error: profileError } = await supabase
                .from('profiles')
                .select('id, email')
                .eq('email', inviteEmail.trim())
                .limit(1);

            if (profileError) throw profileError;

            if (!profiles || profiles.length === 0) {
                toast.error('User tidak ditemukan. Pastikan mereka sudah register di aplikasi.');
                return;
            }

            const targetUser = profiles[0];

            // 2. Add to user_venues
            const { error: insertError } = await supabase
                .from('user_venues')
                .insert({
                    user_id: targetUser.id,
                    venue_id: currentVenueId,
                    role: 'staff' // Default role
                });

            if (insertError) {
                if (insertError.code === '23505') { // Unique violation
                    toast.error('User sudah menjadi anggota tim.');
                } else {
                    throw insertError;
                }
            } else {
                toast.success('Berhasil menambahkan anggota tim!');
                setInviteEmail('');
                fetchMembers();
            }
        } catch (error: any) {
            console.error('Error inviting user:', error);
            toast.error('Gagal menambahkan user: ' + error.message);
        } finally {
            setIsInviting(false);
        }
    };

    const handleUpdateRole = async (memberId: string, newRole: AppRole) => {
        try {
            await supabase
                .from('user_venues')
                .update({ role: newRole })
                .eq('id', memberId);

            toast.success('Role berhasil diupdate');
            // Optimistic update
            setMembers(members.map(m => m.id === memberId ? { ...m, role: newRole } : m));
        } catch (error) {
            toast.error('Gagal update role');
        }
    };

    const handleRemoveMember = async (memberId: string) => {
        if (!confirm('Yakin ingin menghapus anggota ini dari tim?')) return;

        try {
            await supabase
                .from('user_venues')
                .delete()
                .eq('id', memberId);

            toast.success('Anggota berhasil dihapus');
            setMembers(members.filter(m => m.id !== memberId));
        } catch (error) {
            toast.error('Gagal menghapus anggota');
        }
    };

    return (
        <div className="flex flex-col gap-6 max-w-4xl">
            <div className="border-l-4 border-black pl-4">
                <h2 className="text-2xl font-black italic uppercase tracking-tighter">Manajemen Tim</h2>
                <p className="text-gray-500 font-bold">Kelola akses staff, manager, dan kasir.</p>
            </div>

            {isOwner && (
                <form onSubmit={handleInvite} className="bg-white border-2 border-black p-4 shadow-neo flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1 w-full">
                        <label className="text-xs font-bold uppercase mb-1 block">Tambah Anggota (Email)</label>
                        <NeoInput
                            type="email"
                            placeholder="email@user.com"
                            value={inviteEmail}
                            onChange={e => setInviteEmail(e.target.value)}
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isInviting}
                        className="bg-brand-lime text-black font-black px-6 py-2 uppercase border-2 border-black hover:bg-lime-500 transition-all flex items-center gap-2 h-[42px]"
                    >
                        {isInviting ? 'Processing...' : <><UserPlus size={18} /> Tambah</>}
                    </button>
                </form>
            )}

            <div className="bg-white border-2 border-black shadow-neo overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-black text-white uppercase text-sm font-black">
                        <tr>
                            <th className="p-3">Nama / Email</th>
                            <th className="p-3">Role</th>
                            <th className="p-3 text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {isLoading ? (
                            <tr><td colSpan={3} className="p-4 text-center">Loading team...</td></tr>
                        ) : members.length === 0 ? (
                            <tr><td colSpan={3} className="p-4 text-center">Belum ada anggota tim lain.</td></tr>
                        ) : (
                            members.map(member => (
                                <tr key={member.id} className="hover:bg-gray-50">
                                    <td className="p-3">
                                        <div className="flex flex-col">
                                            <span className="font-bold">{member.profile.full_name || 'No Name'}</span>
                                            <span className="text-xs text-gray-500">{member.profile.email}</span>
                                        </div>
                                    </td>
                                    <td className="p-3">
                                        {isOwner && member.role !== 'owner' ? (
                                            <select
                                                value={member.role}
                                                onChange={(e) => handleUpdateRole(member.id, e.target.value as AppRole)}
                                                className="border-2 border-gray-300 p-1 text-sm font-bold bg-white"
                                            >
                                                <option value="manager">Manager</option>
                                                <option value="cashier">Cashier</option>
                                                <option value="staff">Staff</option>
                                            </select>
                                        ) : (
                                            <span className={`inline-block px-2 py-1 text-xs font-black uppercase rounded border-2 ${member.role === 'owner' ? 'bg-purple-100 border-purple-500 text-purple-700' :
                                                member.role === 'manager' ? 'bg-blue-100 border-blue-500 text-blue-700' :
                                                    member.role === 'cashier' ? 'bg-green-100 border-green-500 text-green-700' :
                                                        'bg-gray-100 border-gray-500 text-gray-700'
                                                }`}>
                                                {member.role}
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-3 text-right">
                                        {isOwner && member.role !== 'owner' && (
                                            <button
                                                onClick={() => handleRemoveMember(member.id)}
                                                className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded"
                                                title="Hapus Anggota"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {!isOwner && (
                <div className="bg-blue-50 border-2 border-blue-200 p-3 text-sm text-blue-800 font-bold flex gap-2 items-center">
                    <Shield size={18} />
                    Hanya Owner yang dapat mengelola anggota tim.
                </div>
            )}
        </div>
    );
};
