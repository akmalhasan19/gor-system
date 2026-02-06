'use client';

import React from 'react';
import { MemberList } from "@/components/members/member-list";
import { usePageRefresh } from '@/hooks/use-page-refresh';

export default function MembersPage() {
    // Auto-refresh customers when navigating to this page
    usePageRefresh('members');
    return (
        <div className="flex-1 p-0 overflow-y-auto bg-grid-brown">
            <MemberList />
        </div>
    );
}
