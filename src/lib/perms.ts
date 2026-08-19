export type Perms = {
  chancellor: boolean;
  viewWhy: boolean;
  viewHow: boolean;
  viewTraining: boolean;
  viewDirectory: boolean;
  viewQuad: boolean;
  viewRemarkable: boolean;
  viewTeam: boolean;
  trainNewHires: boolean;
  trainSpecialist: boolean;
  trainMit: boolean;
  trainManagers: boolean;
  manageUsers: boolean;
  manageTraining: boolean;
  editSite: boolean;
};

export const ALL_OFF_PERMS: Perms = {
  chancellor: false,
  viewWhy: true,
  viewHow: true,
  viewTraining: false,
  viewDirectory: false,
  viewQuad: false,
  viewRemarkable: false,
  viewTeam: false,
  trainNewHires: false,
  trainSpecialist: false,
  trainMit: false,
  trainManagers: false,
  manageUsers: false,
  manageTraining: false,
  editSite: false,
};

export const SUPER_PERMS: Perms = {
  chancellor: true,
  viewWhy: true,
  viewHow: true,
  viewTraining: true,
  viewDirectory: true,
  viewQuad: true,
  viewRemarkable: true,
  viewTeam: true,
  trainNewHires: true,
  trainSpecialist: true,
  trainMit: true,
  trainManagers: true,
  manageUsers: true,
  manageTraining: true,
  editSite: true,
};

export function parsePerms(value: unknown): Perms {
  const raw = value && typeof value === "object" ? (value as Partial<Perms>) : {};
  return { ...ALL_OFF_PERMS, ...raw, chancellor: Boolean(raw.chancellor) };
}
