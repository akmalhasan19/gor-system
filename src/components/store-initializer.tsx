"use client";

import { useEffect } from "react";
import { useAppStore } from "@/lib/store";

export const StoreInitializer = () => {
    useEffect(() => {
        useAppStore.persist.rehydrate();
    }, []);

    return null;
};
