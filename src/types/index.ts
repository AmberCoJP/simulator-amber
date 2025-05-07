export interface LoginFormData {
  email: string;
  password: string;
}

export interface ElectricityData {
  buildingType: 'office' | 'factory' | 'store' | 'residential';
  floorArea: number;
  numberOfPeople: number;
  electricityUsage: number;
  peakDemand: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
} 