"use client";

import { useAuth } from "@/lib/auth";
import { fullName, imageSrc } from "@/lib/format";
import { IconUser } from "../Icons";
import styles from "./RoleProfile.module.css";

/** Avatar + name + role label at the top of the staff sidebars (admin, superadmin, disnakertrans). */
export function RoleProfile({ label }: { label: string }) {
  const { user } = useAuth();
  return (
    <div className={styles.profile}>
      <span className={styles.avatar}>{user?.faceImage ? <img src={imageSrc(user.faceImage)} alt="" /> : <IconUser />}</span>
      <span className={styles.nameBox}>
        <strong>{fullName(user) || label}</strong>
        <small>{label}</small>
      </span>
    </div>
  );
}
