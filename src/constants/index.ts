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
  // { value: 'discounted_charge', label: '割引後料金' },
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