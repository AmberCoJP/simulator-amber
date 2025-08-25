export const API_BASE_URL = 'http://localhost:3000/api';

export const ROUTES = {
  LOGIN: '/',
  DATA_ENTRY: '/data-entry',
};

export const OPTION_LIST = [
  { value: 'trade_name', label: '商流一覧' },
  { value: 'jepx', label: 'Jepxデータ' },
  { value: 'fuel_adjustment', label: '燃料調整費' },
  { value: 'takuso_price', label: '託送料金' },
  { value: 'capacity_contribution', label: '容量拠出金' },
  { value: 'service_charge', label: 'サービス料' },
  { value: 'renewable_surcharge', label: '再エネ賦課金' },
  { value: 'incentive', label: 'インセンティブ' },
  // { value: 'discounted_charge', label: '割引後料金' },
];

// インセンティブ手数料テーブル
export const INCENTIVE_FEE_TABLE = [
  { kwhRange: '1-199', minKwh: 1, maxKwh: 199, fee: 5800 },
  { kwhRange: '200-399', minKwh: 200, maxKwh: 399, fee: 15000 },
  { kwhRange: '400-599', minKwh: 400, maxKwh: 599, fee: 28000 },
  { kwhRange: '600-799', minKwh: 600, maxKwh: 799, fee: 48000 },
  { kwhRange: '800-999', minKwh: 800, maxKwh: 999, fee: 68000 },
  { kwhRange: '1000+', minKwh: 1000, maxKwh: Infinity, fee: 78000 },
];

// 月のリスト
export const MONTH_LIST = [
  { value: '1', label: '1月' },
  { value: '2', label: '2月' },
  { value: '3', label: '3月' },
  { value: '4', label: '4月' },
  { value: '5', label: '5月' },
  { value: '6', label: '6月' },
  { value: '7', label: '7月' },
  { value: '8', label: '8月' },
  { value: '9', label: '9月' },
  { value: '10', label: '10月' },
  { value: '11', label: '11月' },
  { value: '12', label: '12月' },
];

export const CONTRACT_TYPE_LIST = [
  { value: '従量A', label: '従量A' },
  { value: '従量B', label: '従量B' },
  { value: '従量C', label: '従量C' },
  { value: '動力', label: '動力' },
];

export const REGION_LIST = [
  { value: 'hokkaido', label: '北海道' },
  { value: 'tohoku', label: '東北' },
  { value: 'tokyo', label: '東京' },
  { value: 'chubu', label: '中部' },
  { value: 'hokuriku', label: '北陸' },
  { value: 'kansai', label: '関西' },
  { value: 'chugoku', label: '中国' },
  { value: 'shikoku', label: '四国' },
  { value: 'kyushu', label: '九州' },
];

export const ERROR_MESSAGES = {
  REQUIRED: 'この項目は必須です',
  INVALID_EMAIL: '有効なメールアドレスを入力してください',
  INVALID_NUMBER: '有効な数値を入力してください',
  MIN_VALUE: (min: number) => `${min}以上の値を入力してください`,
  MAX_VALUE: (max: number) => `${max}以下の値を入力してください`,
}; 