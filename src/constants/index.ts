export const API_BASE_URL = 'http://localhost:3000/api';

export const ROUTES = {
  LOGIN: '/',
  DATA_ENTRY: '/data-entry',
};

export const BUILDING_TYPES = [
  { value: 'office', label: 'オフィス' },
  { value: 'factory', label: '工場' },
  { value: 'store', label: '店舗' },
  { value: 'residential', label: '住宅' },
];

export const ERROR_MESSAGES = {
  REQUIRED: 'この項目は必須です',
  INVALID_EMAIL: '有効なメールアドレスを入力してください',
  INVALID_NUMBER: '有効な数値を入力してください',
  MIN_VALUE: (min: number) => `${min}以上の値を入力してください`,
  MAX_VALUE: (max: number) => `${max}以下の値を入力してください`,
}; 