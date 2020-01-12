export interface Entity {
  docType?: string;
}

export interface Host extends Entity {
  id: string;
  ram: number;
  pe: number;
  owner: string;
}
