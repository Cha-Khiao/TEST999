// src/types/index.ts
export interface Center {
  _id: string;
  name: string;
  location?: string;
  district?: string;
  subdistrict?: string;
  capacity?: number;
  capacityStatus?: string;
  shelterType?: string;
  phoneNumbers?: string[];
  status: string;
}