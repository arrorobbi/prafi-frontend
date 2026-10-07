"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, ApiError } from "./api";
import { useAuth } from "./auth";
import type { TenantProfile } from "./types";

/** The logged-in tenant's shop profile (GET /api/tenants/me); null until they create one. */
interface TenantProfileValue {
  profile: TenantProfile | null;
  loading: boolean;
  reload: () => Promise<void>;
  setProfile: (p: TenantProfile | null) => void;
}

const Ctx = createContext<TenantProfileValue>({ profile: null, loading: true, reload: async () => {}, setProfile: () => {} });

export function TenantProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<TenantProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const isTenant = user?.role === "tenant";

  const reload = useCallback(async () => {
    try {
      const { data } = await api.tenants.mine();
      setProfile(data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isTenant) reload();
  }, [isTenant, reload]);

  return <Ctx.Provider value={{ profile, loading, reload, setProfile }}>{children}</Ctx.Provider>;
}

export const useTenantProfile = () => useContext(Ctx);
