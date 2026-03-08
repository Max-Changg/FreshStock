export type RowKind = 'item' | 'draft' | 'placeholder';

export interface FlatRow {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  dateAdded: string;
  expiryDate: string;
  rowKind: RowKind;
}

export interface DraftRow {
  draftId: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  dateAdded: string;
  expiryDate: string;
}
