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

// 商流データの型定義
export interface Trade {
  id: string;
  tradeId: string;
  tradeName: string;
  registrationDate?: string;
  iconImage?: string;
  createdAt?: any;
  updatedAt?: any;
}

// 基本データの型定義
export interface BaseData {
  id: string;
  createdAt?: any;
  updatedAt?: any;
}

// 燃料調整費データの型定義
export interface FuelAdjustmentData extends BaseData {
  tradeId: string;
  region: string;
  contract: string;
  areaLossRate: number;
  startDate: string;
}

// 託送料金データの型定義
export interface TakusoPriceData extends BaseData {
  tradeId: string;
  region: string;
  contract: string;
  basicPriceType: 'per_kw' | 'tiered';
  basicPrice?: number;
  basicPriceFirst6kw?: number;
  basicPriceOver6kw?: number;
  volumePrice: number;
  startDate: string;
}

// 容量拠出金データの型定義
export interface CapacityContributionData extends BaseData {
  tradeId: string;
  region: string;
  contract: string;
  price: number;
  startDate: string;
}

// サービス料データの型定義
export interface ServiceChargeData extends BaseData {
  price: number;
  startDate: string;
}

// 再エネ賦課金データの型定義
export interface RenewableSurchargeData extends BaseData {
  price: number;
  startDate: string;
}

// インセンティブデータの型定義
export interface IncentiveData extends BaseData {
  tradeId: string;
  contract: string;
  monthlyIndices: {
    [month: string]: number; // 1-12月の指数
  };
  // 手数料テーブル（従来のパターン）
  feeTable?: {
    kwhRange: string;
    minKwh: number;
    maxKwh: number;
    fee: number;
  }[];
  // 一律料金パターン
  flatRate?: {
    fee: number; // 一律料金
    minimumAcquisition?: number; // 最小獲得件数（これ以下はインセンティブ無し）
  };
  startDate: string;
}

// Jepxデータの型定義
export interface JepxData extends BaseData {
  date: string;
  systemAverage: number;
  areaAverages: {
    hokkaido: number;
    tohoku: number;
    tokyo: number;
    chubu: number;
    hokuriku: number;
    kansai: number;
    chugoku: number;
    shikoku: number;
    kyushu: number;
  };
}

// モーダルデータの型定義
export interface ModalData {
  tradeName: string;
  registrationDate: string;
  iconImage: File | null;
  flow: string;
  region: string;
  contract: string;
  areaLossRate: string;
  startDate: string;
  basicPrice: string;
  basicPriceFirst6kw: string;
  basicPriceOver6kw: string;
  basicPriceType: 'per_kw' | 'tiered';
  volumePrice: string;
  price: string;
  servicePrice: string;
  // インセンティブ関連
  monthlyIndices: { [month: string]: string };
  feeTable: {
    kwhRange: string;
    minKwh: string;
    maxKwh: string;
    fee: string;
  }[];
  // インセンティブの設定パターン
  incentiveType: 'feeTable' | 'flatRate';
  // 一律料金パターン
  flatRateFee: string;
  minimumAcquisition: string;
}

// 計算詳細の型定義
export interface CalculationDetails {
  takusoBasic: {
    basicPriceType: string;
    basicPrice?: number;
    basicPriceFirst6kw?: number;
    basicPriceOver6kw?: number;
    contractCapacity: number;
  };
  capacityContribution: {
    price: number;
    contractCapacity: number;
  };
  powerSource: {
    jepxPrice: number;
    areaLossRate: number;
    usage: number;
  };
  serviceCharge: {
    price: number;
    usage: number;
  };
  takusoVolume: {
    price: number;
    usage: number;
  };
  renewableSurcharge: {
    price: number;
    usage: number;
  };
}

// 計算結果の型定義
export interface CalculationResult {
  tradeName: string;
  takusoBasic: number;
  capacityContribution: number;
  powerSource: number;
  serviceCharge: number;
  takusoVolume: number;
  renewableSurcharge: number;
  subtotal: number;
  governmentSupport: number;
  total: number;
  details: CalculationDetails;
}

// フォームデータの型定義
export interface FormData {
  contractType: string;
  contractCategory: string;
  region: string;
  usage: string;
  currentPrice: string;
  year: string;
  month: string;
  governmentSupport: string;
  morningPercent: string;
  daytimePercent: string;
  nightPercent: string;
  meterReadingStart: string;
  meterReadingEnd: string;
  contractCapacity: string;
}

// 計算パラメータの型定義
export interface CalculationParams {
  tradeId: string;
  region: string;
  contractCapacity: number;
  usage: number;
  year: string;
  month: string;
  governmentSupport: number;
  contractType: string;
  contractCategory: string;
  isZeroUsage: boolean;
}

// データタイプの列挙型
export enum DataType {
  TRADE_NAME = 'trade_name',
  JEPX = 'jepx',
  FUEL_ADJUSTMENT = 'fuel_adjustment',
  TAKUSO_PRICE = 'takuso_price',
  CAPACITY_CONTRIBUTION = 'capacity_contribution',
  SERVICE_CHARGE = 'service_charge',
  RENEWABLE_SURCHARGE = 'renewable_surcharge',
  INCENTIVE = 'incentive'
}

// 地域の列挙型
export enum Region {
  HOKKAIDO = 'hokkaido',
  TOHOKU = 'tohoku',
  TOKYO = 'tokyo',
  CHUBU = 'chubu',
  HOKURIKU = 'hokuriku',
  KANSAI = 'kansai',
  CHUGOKU = 'chugoku',
  SHIKOKU = 'shikoku',
  KYUSHU = 'kyushu'
}

// 契約タイプの列挙型
export enum ContractType {
  VOLUME_A = '従量A',
  VOLUME_B = '従量B',
  VOLUME_C = '従量C',
  POWER = '動力'
} 