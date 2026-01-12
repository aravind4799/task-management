export interface IOrganization {
  id: string;
  name: string;
  parentId: string | null; // null for root organizations
  createdAt: Date;
  updatedAt: Date;
}
