export interface SortEntry {
  field: string;
  direction: 'asc' | 'desc';
}

export interface ViewSort {
  field: string;
  direction: string;
}

export interface QuerySort {
  field: string;
  direction: string;
  type: string;
}
