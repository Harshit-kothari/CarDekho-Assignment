export type FuelType = 'Petrol' | 'Diesel' | 'EV' | 'CNG' | 'Hybrid';

export type Transmission = 'Manual' | 'Automatic';

export type BodyType = 'Hatchback' | 'Sedan' | 'SUV' | 'MPV' | 'Coupe SUV';

export type AcQuality = 'Basic' | 'Good' | 'Excellent';

export type SteeringType = 'Electric' | 'Hydraulic' | 'Electro-Hydraulic';

export interface Car {
  id: string;
  name: string;
  company: string;
  model: string;
  transmission: Transmission;
  fuel: FuelType;
  /** km/l for ICE/CNG; km/kWh for EV */
  mileageCity: number;
  mileageHighway: number;
  /** Global NCAP style 0–5 stars */
  safetyRating: number;
  /** Ex-showroom, lakhs INR */
  priceLakh: number;
  /** Owner sentiment 1–5 */
  reviewsScore: number;
  bodyType: BodyType;
  /** After-sales experience 1–10 */
  postPurchaseServiceScore: number;
  launchYear: number;
  seating: number;
  luggageLitres: number;
  easyChildSeatMounts: boolean;
  acQuality: AcQuality;
  airbags: number;
  abs: boolean;
  groundClearanceMm: number;
  infotainmentSystem: string;
  steeringType: SteeringType;
}

export interface CarFilters {
  query: string;
  company: string;
  model: string;
  priceMin: number | null;
  priceMax: number | null;
  fuels: FuelType[];
  transmission: Transmission | '';
  bodyTypes: BodyType[];
  safetyMin: number | null;
  seatingMin: number | null;
  yearMin: number | null;
  yearMax: number | null;
  absOnly: boolean | null;
  airbagsMin: number | null;
}

export const emptyCarFilters = (): CarFilters => ({
  query: '',
  company: '',
  model: '',
  priceMin: null,
  priceMax: null,
  fuels: [],
  transmission: '',
  bodyTypes: [],
  safetyMin: null,
  seatingMin: null,
  yearMin: null,
  yearMax: null,
  absOnly: null,
  airbagsMin: null
});
