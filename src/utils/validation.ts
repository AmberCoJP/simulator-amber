import { DataType, Region, ContractType } from '../types/index.ts';

// バリデーションエラーの型定義
export interface ValidationError {
  field: string;
  message: string;
}

// バリデーション結果の型定義
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// 基本バリデーション関数
export const validateRequired = (value: any, fieldName: string): ValidationError | null => {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return {
      field: fieldName,
      message: `${fieldName}は必須項目です`
    };
  }
  return null;
};

export const validateNumber = (value: any, fieldName: string, min?: number, max?: number): ValidationError | null => {
  const numValue = parseFloat(value);
  if (isNaN(numValue)) {
    return {
      field: fieldName,
      message: `${fieldName}は数値で入力してください`
    };
  }
  
  if (min !== undefined && numValue < min) {
    return {
      field: fieldName,
      message: `${fieldName}は${min}以上の値を入力してください`
    };
  }
  
  if (max !== undefined && numValue > max) {
    return {
      field: fieldName,
      message: `${fieldName}は${max}以下の値を入力してください`
    };
  }
  
  return null;
};

export const validateDate = (value: any, fieldName: string): ValidationError | null => {
  if (!value) {
    return {
      field: fieldName,
      message: `${fieldName}は必須項目です`
    };
  }
  
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    return {
      field: fieldName,
      message: `${fieldName}は有効な日付を入力してください`
    };
  }
  
  return null;
};

export const validateEnum = (value: any, enumValues: any[], fieldName: string): ValidationError | null => {
  if (!enumValues.includes(value)) {
    return {
      field: fieldName,
      message: `${fieldName}は有効な値を選択してください`
    };
  }
  return null;
};

// 商流データのバリデーション
export const validateTradeData = (data: any): ValidationResult => {
  const errors: ValidationError[] = [];
  
  const tradeNameError = validateRequired(data.tradeName, '商流名');
  if (tradeNameError) errors.push(tradeNameError);
  
  if (data.registrationDate) {
    const dateError = validateDate(data.registrationDate, '登録日');
    if (dateError) errors.push(dateError);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// 燃料調整費データのバリデーション
export const validateFuelAdjustmentData = (data: any): ValidationResult => {
  const errors: ValidationError[] = [];
  
  const tradeIdError = validateRequired(data.tradeId, '商流');
  if (tradeIdError) errors.push(tradeIdError);
  
  const regionError = validateEnum(data.region, Object.values(Region), '地域');
  if (regionError) errors.push(regionError);
  
  const contractError = validateEnum(data.contract, Object.values(ContractType), '契約');
  if (contractError) errors.push(contractError);
  
  const areaLossRateError = validateNumber(data.areaLossRate, '係数', 0);
  if (areaLossRateError) errors.push(areaLossRateError);
  
  const startDateError = validateDate(data.startDate, '適用開始日');
  if (startDateError) errors.push(startDateError);
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// 託送料金データのバリデーション
export const validateTakusoPriceData = (data: any): ValidationResult => {
  const errors: ValidationError[] = [];
  
  const tradeIdError = validateRequired(data.tradeId, '商流');
  if (tradeIdError) errors.push(tradeIdError);
  
  const regionError = validateEnum(data.region, Object.values(Region), '地域');
  if (regionError) errors.push(regionError);
  
  const contractError = validateEnum(data.contract, Object.values(ContractType), '契約');
  if (contractError) errors.push(contractError);
  
  const basicPriceTypeError = validateEnum(data.basicPriceType, ['per_kw', 'tiered'], '託送基本料金の設定方法');
  if (basicPriceTypeError) errors.push(basicPriceTypeError);
  
  if (data.basicPriceType === 'per_kw') {
    const basicPriceError = validateNumber(data.basicPrice, '託送基本料金', 0);
    if (basicPriceError) errors.push(basicPriceError);
  } else if (data.basicPriceType === 'tiered') {
    const first6kwError = validateNumber(data.basicPriceFirst6kw, '6kWまでの料金', 0);
    if (first6kwError) errors.push(first6kwError);
    
    const over6kwError = validateNumber(data.basicPriceOver6kw, '6kW～の単価', 0);
    if (over6kwError) errors.push(over6kwError);
  }
  
  const volumePriceError = validateNumber(data.volumePrice, '託送従量料金', 0);
  if (volumePriceError) errors.push(volumePriceError);
  
  const startDateError = validateDate(data.startDate, '適用開始日');
  if (startDateError) errors.push(startDateError);
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// 容量拠出金データのバリデーション
export const validateCapacityContributionData = (data: any): ValidationResult => {
  const errors: ValidationError[] = [];
  
  const tradeIdError = validateRequired(data.tradeId, '商流');
  if (tradeIdError) errors.push(tradeIdError);
  
  const regionError = validateEnum(data.region, Object.values(Region), '地域');
  if (regionError) errors.push(regionError);
  
  const contractError = validateEnum(data.contract, Object.values(ContractType), '契約');
  if (contractError) errors.push(contractError);
  
  const priceError = validateNumber(data.price, '容量拠出金', 0);
  if (priceError) errors.push(priceError);
  
  const startDateError = validateDate(data.startDate, '適用開始日');
  if (startDateError) errors.push(startDateError);
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// サービス料データのバリデーション
export const validateServiceChargeData = (data: any): ValidationResult => {
  const errors: ValidationError[] = [];
  
  const priceError = validateNumber(data.price, '料金', 0);
  if (priceError) errors.push(priceError);
  
  const startDateError = validateDate(data.startDate, '適用開始日');
  if (startDateError) errors.push(startDateError);
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// 再エネ賦課金データのバリデーション
export const validateRenewableSurchargeData = (data: any): ValidationResult => {
  const errors: ValidationError[] = [];
  
  const priceError = validateNumber(data.price, '料金', 0);
  if (priceError) errors.push(priceError);
  
  const startDateError = validateDate(data.startDate, '適用開始日');
  if (startDateError) errors.push(startDateError);
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// インセンティブデータのバリデーション
export const validateIncentiveData = (data: any): ValidationResult => {
  const errors: ValidationError[] = [];
  
  const tradeIdError = validateRequired(data.tradeId, '商流');
  if (tradeIdError) errors.push(tradeIdError);
  
  const contractError = validateEnum(data.contract, Object.values(ContractType), '契約');
  if (contractError) errors.push(contractError);
  
  // 月次指数のバリデーション
  if (!data.monthlyIndices || typeof data.monthlyIndices !== 'object') {
    errors.push({
      field: 'monthlyIndices',
      message: '月次指数は必須項目です'
    });
  } else {
    for (let month = 1; month <= 12; month++) {
      const monthKey = month.toString();
      const indexValue = data.monthlyIndices[monthKey];
      if (indexValue === undefined || indexValue === null || indexValue === '') {
        errors.push({
          field: `monthlyIndices.${monthKey}`,
          message: `${month}月の指数は必須項目です`
        });
      } else {
        const indexError = validateNumber(indexValue, `${month}月の指数`, 0);
        if (indexError) errors.push(indexError);
      }
    }
  }
  
  // インセンティブタイプのバリデーション
  if (!data.incentiveType || (data.incentiveType !== 'feeTable' && data.incentiveType !== 'flatRate')) {
    errors.push({
      field: 'incentiveType',
      message: 'インセンティブの設定パターンを選択してください'
    });
  } else {
    if (data.incentiveType === 'feeTable') {
      // 手数料テーブルのバリデーション
      if (!data.feeTable || !Array.isArray(data.feeTable) || data.feeTable.length === 0) {
        errors.push({
          field: 'feeTable',
          message: '手数料テーブルは必須項目です'
        });
      } else {
        data.feeTable.forEach((feeItem: any, index: number) => {
          const kwhRangeError = validateRequired(feeItem.kwhRange, `手数料テーブル${index + 1}の獲得件数範囲`);
          if (kwhRangeError) errors.push(kwhRangeError);
          
          const minKwhError = validateNumber(feeItem.minKwh, `手数料テーブル${index + 1}の最小kWh`, 0);
          if (minKwhError) errors.push(minKwhError);
          
          // 最大kWhは空欄でもOK（最大値なしを意味する）
          if (feeItem.maxKwh !== undefined && feeItem.maxKwh !== null && feeItem.maxKwh !== '') {
            // 文字列の場合は空文字チェック
            if (typeof feeItem.maxKwh === 'string' && feeItem.maxKwh.trim() === '') {
              // 空文字の場合はスキップ
            } else {
              const maxKwhError = validateNumber(feeItem.maxKwh, `手数料テーブル${index + 1}の最大kWh`, 0);
              if (maxKwhError) errors.push(maxKwhError);
            }
          }
          
          const feeError = validateNumber(feeItem.fee, `手数料テーブル${index + 1}の手数料`, 0);
          if (feeError) errors.push(feeError);
        });
      }
    } else if (data.incentiveType === 'flatRate') {
      console.log('バリデーション - 一律料金データ:', data);
      // 一律料金のバリデーション
      if (!data.flatRate || !data.flatRate.fee) {
        console.log('バリデーションエラー: 一律料金が未設定');
        errors.push({
          field: 'flatRate.fee',
          message: '一律料金は必須項目です'
        });
      } else {
        console.log('バリデーション - 一律料金の値:', data.flatRate.fee);
        const flatRateFeeError = validateNumber(data.flatRate.fee, '一律料金', 0);
        if (flatRateFeeError) errors.push(flatRateFeeError);
      }
      
      // 最小獲得件数は任意（空欄でもOK）
      if (data.flatRate && data.flatRate.minimumAcquisition !== undefined && data.flatRate.minimumAcquisition !== null && data.flatRate.minimumAcquisition !== '') {
        console.log('バリデーション - 最小獲得件数の値:', data.flatRate.minimumAcquisition);
        const minimumAcquisitionError = validateNumber(data.flatRate.minimumAcquisition, '最小獲得件数', 0);
        if (minimumAcquisitionError) errors.push(minimumAcquisitionError);
      }
    }
  }
  
  const startDateError = validateDate(data.startDate, '適用開始日');
  if (startDateError) errors.push(startDateError);
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// データタイプに基づく汎用バリデーション
export const validateDataByType = (dataType: DataType, data: any): ValidationResult => {
  switch (dataType) {
    case DataType.TRADE_NAME:
      return validateTradeData(data);
    case DataType.FUEL_ADJUSTMENT:
      return validateFuelAdjustmentData(data);
    case DataType.TAKUSO_PRICE:
      return validateTakusoPriceData(data);
    case DataType.CAPACITY_CONTRIBUTION:
      return validateCapacityContributionData(data);
    case DataType.SERVICE_CHARGE:
      return validateServiceChargeData(data);
    case DataType.RENEWABLE_SURCHARGE:
      return validateRenewableSurchargeData(data);
    case DataType.INCENTIVE:
      return validateIncentiveData(data);
    case DataType.JEPX:
      // Jepxデータのバリデーションは別途実装
      return { isValid: true, errors: [] };
    default:
      return {
        isValid: false,
        errors: [{ field: 'dataType', message: '未対応のデータタイプです' }]
      };
  }
};

// エラーメッセージの表示用フォーマット
export const formatValidationErrors = (errors: ValidationError[]): string => {
  return errors.map(error => `${error.field}: ${error.message}`).join('\n');
}; 