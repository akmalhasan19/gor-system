'use client';

import React from 'react';
import { MemberList } from "@/components/members/member-list";

export default function MembersPage() {
    return (
        <div className="flex-1 p-0 overflow-y-auto">
            <MemberList />
        </div>
    );
}
