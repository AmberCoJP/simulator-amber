export const API_BASE_URL = 'http://localhost:3000/api';

export const ROUTES = {
  LOGIN: '/',
  DATA_ENTRY: '/data-entry',
};

export const OPTION_LIST = [
  { value: 'trade_name', label: '商流一覧' },
  { value: 'jepx', label: 'Jepxデータ' },
  { value: 'fuel_adjustment', label: '燃料調整費' },
  { value: 'charge', label: '料金' },
  { value: 'other_charge', label: 'その他料金' },
  { value: 'season_index', label: '季節指数' },
  { value: 'capacity_contribution', label: '容量拠出金' },
  { value: 'incentive', label: 'インセンティブ' },
  { value: 'renewable_surcharge', label: '再エネ賦課金' },
  { value: 'discounted_charge', label: '割引後料金' },
];

export const ERROR_MESSAGES = {
  REQUIRED: 'この項目は必須です',
  INVALID_EMAIL: '有効なメールアドレスを入力してください',
  INVALID_NUMBER: '有効な数値を入力してください',
  MIN_VALUE: (min: number) => `${min}以上の値を入力してください`,
  MAX_VALUE: (max: number) => `${max}以下の値を入力してください`,
}; 