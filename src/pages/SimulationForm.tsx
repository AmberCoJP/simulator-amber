import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import styled from 'styled-components';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase/index.ts';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import IconButton from '@mui/material/IconButton';

// 定数定義
const CONSTANTS = {
  REGIONS: {
    HOKKAIDO: '北海道',
    TOHOKU: '東北',
    TOKYO: '関東',
    CHUBU: '中部',
    HOKURIKU: '北陸',
    KANSAI: '関西',
    CHUGOKU: '中国',
    SHIKOKU: '四国',
    KYUSHU: '九州'
  },
  CONTRACT_TYPES: {
    VOLUME: '従量',
    // POWER: '動力'
  },
  CONTRACT_CATEGORIES: {
    A: 'A',
    B: 'B',
    C: 'C'
  },
  DEFAULT_VALUES: {
    CONTRACT_CAPACITY_A: 6,
    CONTRACT_CAPACITY_B: 8,
    CONTRACT_CAPACITY_C: 10,
    // CONTRACT_CAPACITY_POWER: 8
  },
  TAX_RATE: 1.1,
  ZERO_USAGE_DISCOUNT: 0.5
} as const;

const REGION_MAP: Record<string, string> = {
  [CONSTANTS.REGIONS.HOKKAIDO]: 'hokkaido',
  [CONSTANTS.REGIONS.TOHOKU]: 'tohoku',
  [CONSTANTS.REGIONS.TOKYO]: 'tokyo',
  [CONSTANTS.REGIONS.CHUBU]: 'chubu',
  [CONSTANTS.REGIONS.HOKURIKU]: 'hokuriku',
  [CONSTANTS.REGIONS.KANSAI]: 'kansai',
  [CONSTANTS.REGIONS.CHUGOKU]: 'chugoku',
  [CONSTANTS.REGIONS.SHIKOKU]: 'shikoku',
  [CONSTANTS.REGIONS.KYUSHU]: 'kyushu'
};

const AREA_KEY_MAP: Record<string, string> = {
  [CONSTANTS.REGIONS.KANSAI]: 'kansai',
  [CONSTANTS.REGIONS.TOKYO]: 'tokyo',
  [CONSTANTS.REGIONS.CHUBU]: 'chubu',
  [CONSTANTS.REGIONS.KYUSHU]: 'kyushu',
  [CONSTANTS.REGIONS.HOKKAIDO]: 'hokkaido',
  [CONSTANTS.REGIONS.TOHOKU]: 'tohoku',
  [CONSTANTS.REGIONS.CHUGOKU]: 'chugoku',
  [CONSTANTS.REGIONS.SHIKOKU]: 'shikoku',
  [CONSTANTS.REGIONS.HOKURIKU]: 'hokuriku'
};

// 型定義の改善
interface Trade {
  id: string;
  tradeId?: string;
  tradeName: string;
}

interface CalculationDetails {
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
  incentive: {
    monthlyIndex: number;
    acquiredUnits: number;
    fee: number;
    usage: number;
  };
}

interface CalculationResult {
  tradeName: string;
  takusoBasic: number;
  capacityContribution: number;
  powerSource: number;
  serviceCharge: number;
  takusoVolume: number;
  renewableSurcharge: number;
  incentive: number;
  subtotal: number;
  governmentSupport: number;
  total: number;
  details: CalculationDetails;
}

interface FormData {
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

interface CalculationParams {
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

// データキャッシュ用のインターフェース
interface DataCache {
  takusoPrice: Map<string, any>;
  yoryoPrice: Map<string, any>;
  fuelAdjustment: Map<string, any>;
  jepxMonthlyData: Map<string, any>;
  serviceCharge: Map<string, any>;
  renewableSurcharge: Map<string, any>;
  incentive: Map<string, any>;
}

// カスタムフック: データキャッシュ管理
const useDataCache = () => {
  const cacheRef = useRef<DataCache>({
    takusoPrice: new Map(),
    yoryoPrice: new Map(),
    fuelAdjustment: new Map(),
    jepxMonthlyData: new Map(),
    serviceCharge: new Map(),
    renewableSurcharge: new Map(),
    incentive: new Map()
  });

  const getCacheKey = useCallback((collectionName: string, conditions: Array<{ field: string; operator: string; value: any }>, orderByField?: string) => {
    const conditionStr = conditions
      .map(c => `${c.field}${c.operator}${c.value}`)
      .sort()
      .join('_');
    return `${collectionName}_${conditionStr}_${orderByField || 'none'}`;
  }, []);

  const getCachedData = useCallback((collectionName: keyof DataCache, cacheKey: string) => {
    return cacheRef.current[collectionName].get(cacheKey);
  }, []);

  const setCachedData = useCallback((collectionName: keyof DataCache, cacheKey: string, data: any) => {
    cacheRef.current[collectionName].set(cacheKey, data);
  }, []);

  const clearCache = useCallback(() => {
    cacheRef.current.takusoPrice.clear();
    cacheRef.current.yoryoPrice.clear();
    cacheRef.current.fuelAdjustment.clear();
    cacheRef.current.jepxMonthlyData.clear();
    cacheRef.current.serviceCharge.clear();
    cacheRef.current.renewableSurcharge.clear();
    cacheRef.current.incentive.clear();
  }, []);

  return {
    getCacheKey,
    getCachedData,
    setCachedData,
    clearCache
  };
};

// カスタムフック: 商流データの管理
const useTradeData = () => {
  const [tradeList, setTradeList] = useState<Trade[]>([]);
  const [tradeNameMap, setTradeNameMap] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const fetchTradeList = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const q = query(collection(db, 'trend'), orderBy('tradeName', 'asc'));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Trade[];

      setTradeList(data);

      // IDと商流名のマッピングを作成
      const nameMap: Record<string, string> = {};
      data.forEach((trade) => {
        nameMap[trade.tradeId || trade.id] = trade.tradeName;
      });
      setTradeNameMap(nameMap);

    } catch (error) {
      console.error('商流一覧取得エラー:', error);
      setError('商流一覧の取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    tradeList,
    tradeNameMap,
    isLoading,
    error,
    fetchTradeList
  };
};

// カスタムフック: 計算ロジック
const useCalculationLogic = (tradeNameMap: Record<string, string>) => {

  // 契約容量を取得する関数
  const getContractCapacity = useCallback((contractType: string, contractCategory: string, contractCapacity: string): number => {
    if (contractType === CONSTANTS.CONTRACT_TYPES.VOLUME && contractCategory === CONSTANTS.CONTRACT_CATEGORIES.A) {
      return CONSTANTS.DEFAULT_VALUES.CONTRACT_CAPACITY_A;
      // } else if (contractType === CONSTANTS.CONTRACT_TYPES.POWER) {
      //   return CONSTANTS.DEFAULT_VALUES.CONTRACT_CAPACITY_POWER;
    } else {
      return parseFloat(contractCapacity) || CONSTANTS.DEFAULT_VALUES.CONTRACT_CAPACITY_B;
    }
  }, []);

  // 契約種別を取得する関数
  const getContractType = useCallback((contractType: string, contractCategory: string): string => {
    if (contractType === CONSTANTS.CONTRACT_TYPES.VOLUME) {
      return `従量${contractCategory}`;
    } else {
      // return CONSTANTS.CONTRACT_TYPES.POWER;
      return `従量${contractCategory}`; // 動力の場合は従量として扱う
    }
  }, []);

  // 地域名をデータベース用の値に変換する関数
  const getDbRegion = useCallback((region: string): string => {
    return REGION_MAP[region] || region;
  }, []);

  // データベースからデータを取得する共通関数
  const fetchDataFromDb = useCallback(async (
    collectionName: string,
    conditions: Array<{ field: string; operator: string; value: any }>,
    orderByField?: string
  ) => {
    let q = query(collection(db, collectionName));

    conditions.forEach(({ field, operator, value }) => {
      q = query(q, where(field, operator as any, value));
    });

    if (orderByField) {
      q = query(q, orderBy(orderByField, 'desc'));
    }

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error(`${collectionName}のデータが見つかりません`);
    }

    const result = querySnapshot.docs[0].data();
    return result;
  }, []);

  // 託送基本料を計算する関数
  const calculateTakusoBasic = useCallback(async (params: CalculationParams): Promise<{ amount: number, details: any }> => {
    try {
      const contractType = getContractType(params.contractType, params.contractCategory);
      const dbRegion = getDbRegion(params.region);
      const startDate = `${params.year}-${params.month.padStart(2, '0')}-01`;

      const data = await fetchDataFromDb('takuso_price', [
        { field: 'tradeId', operator: '==', value: params.tradeId },
        { field: 'region', operator: '==', value: dbRegion },
        { field: 'contract', operator: '==', value: contractType },
        { field: 'startDate', operator: '<=', value: startDate }
      ], 'startDate');

      let amount = 0;
      let details: any = {
        basicPriceType: data.basicPriceType,
        contractCapacity: params.contractCapacity
      };

      if (data.basicPriceType === 'per_kw') {
        amount = parseFloat(data.basicPrice) * params.contractCapacity;
        details.basicPrice = parseFloat(data.basicPrice);
      } else if (data.basicPriceType === 'tiered') {
        const first6kwPrice = parseFloat(data.basicPriceFirst6kw);
        const over6kwPrice = parseFloat(data.basicPriceOver6kw);
        amount = first6kwPrice + (params.contractCapacity - 6) * over6kwPrice;
        details.basicPriceFirst6kw = first6kwPrice;
        details.basicPriceOver6kw = over6kwPrice;
      }

      return { amount, details };
    } catch (error) {
      const tradeName = tradeNameMap[params.tradeId] || params.tradeId;
      throw new Error(`${tradeName}の${params.region}託送基本料データが見つかりません`);
    }
  }, [getContractType, getDbRegion, fetchDataFromDb, tradeNameMap]);

  // 容量拠出金を計算する関数
  const calculateCapacityContribution = useCallback(async (params: CalculationParams): Promise<{ amount: number, details: any }> => {
    try {
      const contractType = getContractType(params.contractType, params.contractCategory);
      const dbRegion = getDbRegion(params.region);
      const startDate = `${params.year}-${params.month.padStart(2, '0')}-01`;

      const data = await fetchDataFromDb('yoryo_price', [
        { field: 'tradeId', operator: '==', value: params.tradeId },
        { field: 'region', operator: '==', value: dbRegion },
        { field: 'contract', operator: '==', value: contractType },
        { field: 'startDate', operator: '<=', value: startDate }
      ], 'startDate');

      const price = parseFloat(data.price);
      const amount = price * params.contractCapacity;

      return {
        amount,
        details: { price, contractCapacity: params.contractCapacity }
      };
    } catch (error) {
      const tradeName = tradeNameMap[params.tradeId] || params.tradeId;
      throw new Error(`${tradeName}の${params.region}容量拠出金データが見つかりません`);
    }
  }, [getContractType, getDbRegion, fetchDataFromDb, tradeNameMap]);

  // 電源料金を計算する関数
  const calculatePowerSource = useCallback(async (params: CalculationParams): Promise<{ amount: number, details: any }> => {
    try {
      // Jepx月平均料金を取得
      const jepxData = await fetchDataFromDb('jepx_monthly_data', [
        { field: 'date', operator: '==', value: `${params.year}-${params.month.padStart(2, '0')}` }
      ]);

      const areaKey = AREA_KEY_MAP[params.region] || 'kansai';
      const jepxPrice = jepxData.areaAverages[areaKey];

      // エリア損失率を取得
      const contractType = getContractType(params.contractType, params.contractCategory);
      const dbRegion = getDbRegion(params.region);
      const startDate = `${params.year}-${params.month.padStart(2, '0')}-01`;

      const lossData = await fetchDataFromDb('fuel_adjustment', [
        { field: 'tradeId', operator: '==', value: params.tradeId },
        { field: 'region', operator: '==', value: dbRegion },
        { field: 'contract', operator: '==', value: contractType },
        { field: 'startDate', operator: '<=', value: startDate }
      ], 'startDate');

      const areaLossRate = parseFloat(lossData.areaLossRate) / 100;
      const amount = (params.usage * jepxPrice / (1 - areaLossRate)) * CONSTANTS.TAX_RATE;

      return {
        amount,
        details: { jepxPrice, areaLossRate: parseFloat(lossData.areaLossRate), usage: params.usage }
      };
    } catch (error) {
      const tradeName = tradeNameMap[params.tradeId] || params.tradeId;
      throw new Error(`${tradeName}の${params.region}電源料金データが見つかりません`);
    }
  }, [getContractType, getDbRegion, fetchDataFromDb, tradeNameMap]);

  // サービス料を計算する関数
  const calculateServiceCharge = useCallback(async (usage: number, year: string, month: string): Promise<{ amount: number, details: any }> => {
    try {
      const startDate = `${year}-${month.padStart(2, '0')}-01`;
      const data = await fetchDataFromDb('service_charge', [
        { field: 'startDate', operator: '<=', value: startDate }
      ], 'startDate');

      const price = parseFloat(data.price);
      const amount = price * usage;

      return {
        amount,
        details: { price, usage }
      };
    } catch (error) {
      throw new Error('サービス料データが見つかりません');
    }
  }, [fetchDataFromDb]);

  // 託送従量料金を計算する関数
  const calculateTakusoVolume = useCallback(async (params: CalculationParams): Promise<{ amount: number, details: any }> => {
    try {
      const contractType = getContractType(params.contractType, params.contractCategory);
      const dbRegion = getDbRegion(params.region);
      const startDate = `${params.year}-${params.month.padStart(2, '0')}-01`;

      const data = await fetchDataFromDb('takuso_price', [
        { field: 'tradeId', operator: '==', value: params.tradeId },
        { field: 'region', operator: '==', value: dbRegion },
        { field: 'contract', operator: '==', value: contractType },
        { field: 'startDate', operator: '<=', value: startDate }
      ], 'startDate');

      const price = parseFloat(data.volumePrice);
      const amount = price * params.usage;

      return {
        amount,
        details: { price, usage: params.usage }
      };
    } catch (error) {
      const tradeName = tradeNameMap[params.tradeId] || params.tradeId;
      throw new Error(`${tradeName}の${params.region}託送従量料金データが見つかりません`);
    }
  }, [getContractType, getDbRegion, fetchDataFromDb, tradeNameMap]);

  // 再エネ賦課金を計算する関数
  const calculateRenewableSurcharge = useCallback(async (usage: number, year: string, month: string): Promise<{ amount: number, details: any }> => {
    try {
      const startDate = `${year}-${month.padStart(2, '0')}-01`;
      const data = await fetchDataFromDb('renewable_surcharge', [
        { field: 'startDate', operator: '<=', value: startDate }
      ], 'startDate');

      const price = parseFloat(data.price);
      const amount = price * usage;

      return {
        amount,
        details: { price, usage }
      };
    } catch (error) {
      throw new Error('再エネ賦課金データが見つかりません');
    }
  }, [fetchDataFromDb]);

  // インセンティブを計算する関数
  const calculateIncentive = useCallback(async (params: CalculationParams): Promise<{ amount: number, details: any }> => {
    try {
      const contractType = getContractType(params.contractType, params.contractCategory);
      const startDate = `${params.year}-${params.month.padStart(2, '0')}-01`;

      const data = await fetchDataFromDb('incentive', [
        { field: 'tradeId', operator: '==', value: params.tradeId },
        { field: 'contract', operator: '==', value: contractType },
        { field: 'startDate', operator: '<=', value: startDate }
      ], 'startDate');

      // 該当月の指数を取得（数値キーと文字列キーの両方を試行）
      let monthlyIndex = data.monthlyIndices[params.month];
      if (!monthlyIndex) {
        // 数値キーで試行
        monthlyIndex = data.monthlyIndices[parseInt(params.month)];
      }

      if (!monthlyIndex) {
        throw new Error(`${params.month}月の指数データが見つかりません。利用可能な月: ${Object.keys(data.monthlyIndices).join(', ')}`);
      }

      // 獲得件数を計算（使用量 × 指数）
      const acquiredUnits = params.usage * monthlyIndex;

      let fee = 0;

      // インセンティブタイプに応じて計算
      if (data.incentiveType === 'flatRate') {
        // 一律料金パターン
        // 最小獲得件数チェック
        if (data.flatRate?.minimumAcquisition && acquiredUnits < data.flatRate.minimumAcquisition) {
          fee = 0;
        } else {
          fee = data.flatRate?.fee || 0;
        }
      } else {
        // 手数料テーブルパターン（従来の方式）
        for (const feeItem of data.feeTable) {
          if (acquiredUnits >= feeItem.minKwh && (feeItem.maxKwh === Infinity || acquiredUnits <= feeItem.maxKwh)) {
            fee = feeItem.fee;
            break;
          }
        }
      }

      return {
        amount: fee,
        details: {
          monthlyIndex,
          acquiredUnits,
          fee,
          usage: params.usage
        }
      };
    } catch (error) {
      const tradeName = tradeNameMap[params.tradeId] || params.tradeId;
      throw new Error(`${tradeName}のインセンティブデータが見つかりません`);
    }
  }, [getContractType, fetchDataFromDb, tradeNameMap]);

  return {
    getContractCapacity,
    calculateTakusoBasic,
    calculateCapacityContribution,
    calculatePowerSource,
    calculateServiceCharge,
    calculateTakusoVolume,
    calculateRenewableSurcharge,
    calculateIncentive
  };
};

const Container = styled.div`
  max-width: 400px;
  margin: 0 auto;
  padding: 1rem;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  @media (max-width: 480px) {
    max-width: 100%;
    padding: 0.5rem;
    border-radius: 0;
    box-shadow: none;
  }
`;

const Title = styled.h2`
  font-size: 1.4rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
  color: #222;
`;

const ManualLink = styled.a`
  color: #2956c7;
  font-size: 0.95rem;
  float: right;
  text-decoration: underline;
  margin-top: 0.2rem;
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 0.7rem;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-size: 1rem;
  min-width: 60px;
`;

const Select = styled.select`
  font-size: 1rem;
  padding: 0.3rem 0.5rem;
  border-radius: 4px;
  border: 1px solid #ccc;
`;

const Input = styled.input`
  font-size: 1rem;
  padding: 0.3rem 0.5rem;
  border-radius: 4px;
  border: 1px solid #ccc;
  width: 80px;
`;

const SmallInput = styled(Input)`
  width: 50px;
`;

const Checkbox = styled.input`
  margin-left: 0.5rem;
`;

const DateInput = styled(Input)`
  width: 120px;
`;

const Button = styled.button`
  width: 100%;
  background: #2c2c5e;
  color: #fff;
  font-size: 1.2rem;
  padding: 0.8rem 0;
  border: none;
  border-radius: 8px;
  margin-top: 1.2rem;
  letter-spacing: 0.2em;
  font-weight: bold;
  cursor: pointer;
  @media (max-width: 480px) {
    font-size: 1rem;
    padding: 0.7rem 0;
    border-radius: 4px;
  }
`;

const ResultContainer = styled.div`
  margin-top: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #dee2e6;
`;

const ResultHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const ResultTitle = styled.h3`
  color: #333;
  font-size: 1.1rem;
  margin: 0;
`;

const ResultRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  padding: 0.3rem 0;
  border-bottom: 1px solid #e9ecef;
`;

const ResultLabel = styled.span`
  font-weight: bold;
  color: #495057;
`;

const ResultValue = styled.span`
  font-weight: bold;
  color: #2c2c5e;
`;

const SavingsResultValue = styled(ResultValue)`
  color: #2e7d32;
  background: #e8f5e8;
  padding: 0.4rem 0.8rem;
  font-weight: bold;
`;

const TotalRow = styled(ResultRow)`
  border-top: 2px solid #2c2c5e;
  border-bottom: none;
  font-size: 1.1rem;
  margin-top: 1rem;
  padding-top: 1rem;
`;

const DetailContainer = styled.div`
  margin-top: 0.5rem;
  padding: 0.5rem;
  background: #fff;
  border-radius: 4px;
  border-left: 3px solid #007bff;
  font-size: 0.9rem;
  color: #666;
`;

const DetailRow = styled.div`
  margin-bottom: 0.3rem;
  &:last-child {
    margin-bottom: 0;
  }
`;

const DetailLabel = styled.span`
  font-weight: 500;
  color: #495057;
  margin-right: 0.5rem;
`;

const DetailValue = styled.span`
  color: #2c2c5e;
  font-family: 'Courier New', monospace;
`;

const CalculationFormula = styled.div`
  margin-top: 0.3rem;
  padding: 0.3rem;
  background: #f8f9fa;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
  font-size: 0.85rem;
  color: #495057;
`;

const ErrorMessage = styled.div`
  color: #dc3545;
  background: #f8d7da;
  padding: 0.75rem;
  border-radius: 4px;
  margin-top: 1rem;
  border: 1px solid #f5c6cb;
`;

const LoadingMessage = styled.div`
  color: #0066cc;
  background: #d1ecf1;
  padding: 0.75rem;
  border-radius: 4px;
  margin-top: 1rem;
  border: 1px solid #bee5eb;
  text-align: center;
`;

const SwitchContainer = styled.div`
  display: flex;
  align-items: center;
`;

const TradeResultContainer = styled.div`
  margin-bottom: 1rem;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  overflow: hidden;
`;

const TradeResultHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
  cursor: pointer;
  &:hover {
    background: #e9ecef;
  }
`;

const SavingsTradeResultHeader = styled(TradeResultHeader)`
  background: #e8f5e8;
  border-color: #4caf50;
  border-left: 4px solid #4caf50;
  &:hover {
    background: #d4edda;
  }
`;

const TradeResultContent = styled.div<{ $isExpanded: boolean }>`
  max-height: ${(props: { $isExpanded: boolean }) => props.$isExpanded ? '2000px' : '0'};
  overflow: hidden;
  transition: max-height 0.3s ease-in-out;
`;

const TradeResultDetails = styled.div`
  padding: 1rem;
  background: white;
`;

const ExpandButton = styled(IconButton)`
  margin-left: 0.5rem;
  color: #6c757d;
  &:hover {
    color: #495057;
  }
`;

const SimulationForm: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    contractType: CONSTANTS.CONTRACT_TYPES.VOLUME,
    contractCategory: CONSTANTS.CONTRACT_CATEGORIES.A,
    region: CONSTANTS.REGIONS.KANSAI,
    usage: '',
    currentPrice: '',
    year: '2025',
    month: '4',
    governmentSupport: '0',
    morningPercent: '',
    daytimePercent: '',
    nightPercent: '',
    meterReadingStart: '',
    meterReadingEnd: '',
    contractCapacity: CONSTANTS.DEFAULT_VALUES.CONTRACT_CAPACITY_B.toString()
  });

  const [isZeroUsage, setIsZeroUsage] = useState(false);

  const { tradeList, tradeNameMap, isLoading, error: tradeError, fetchTradeList } = useTradeData();
  const {
    getContractCapacity,
    calculateTakusoBasic,
    calculateCapacityContribution,
    calculatePowerSource,
    calculateServiceCharge,
    calculateTakusoVolume,
    calculateRenewableSurcharge,
    calculateIncentive
  } = useCalculationLogic(tradeNameMap);

  const [calculationResults, setCalculationResults] = useState<CalculationResult[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string>('');
  const [showDetails, setShowDetails] = useState(false);
  const [expandedTrades, setExpandedTrades] = useState<Set<string>>(new Set());

  // コンポーネントマウント時に商流一覧を取得
  useEffect(() => {
    fetchTradeList();
  }, [fetchTradeList]);

  // 商流の展開/折りたたみを切り替える関数
  const toggleTradeExpansion = (tradeName: string) => {
    const newExpandedTrades = new Set(expandedTrades);
    if (newExpandedTrades.has(tradeName)) {
      newExpandedTrades.delete(tradeName);
    } else {
      newExpandedTrades.add(tradeName);
    }
    setExpandedTrades(newExpandedTrades);
  };

  // 単一の商流で計算を実行する関数
  const calculateForTrade = useCallback(async (trade: Trade): Promise<CalculationResult> => {
    const tradeId = trade.tradeId || trade.id;
    const tradeName = trade.tradeName;
    const usage = parseFloat(formData.usage);
    const contractCapacity = getContractCapacity(formData.contractType, formData.contractCategory, formData.contractCapacity);
    const governmentSupport = parseFloat(formData.governmentSupport);

    // 各項目を計算
    const takusoBasicResult = await calculateTakusoBasic({
      tradeId,
      region: formData.region,
      contractCapacity,
      usage,
      year: formData.year,
      month: formData.month,
      governmentSupport,
      contractType: formData.contractType,
      contractCategory: formData.contractCategory,
      isZeroUsage
    });
    const capacityContributionResult = await calculateCapacityContribution({
      tradeId,
      region: formData.region,
      contractCapacity,
      usage,
      year: formData.year,
      month: formData.month,
      governmentSupport,
      contractType: formData.contractType,
      contractCategory: formData.contractCategory,
      isZeroUsage
    });

    // 使用量が0の場合、基本料金以外の計算をスキップ
    let powerSourceResult, serviceChargeResult, takusoVolumeResult, renewableSurchargeResult, incentiveResult;

    if (isZeroUsage) {
      // 使用量が0の場合、基本料金以外は0に設定
      powerSourceResult = { amount: 0, details: { jepxPrice: 0, areaLossRate: 0, usage: 0 } };
      serviceChargeResult = { amount: 0, details: { price: 0, usage: 0 } };
      takusoVolumeResult = { amount: 0, details: { price: 0, usage: 0 } };
      renewableSurchargeResult = { amount: 0, details: { price: 0, usage: 0 } };
      incentiveResult = { amount: 0, details: { monthlyIndex: 0, acquiredUnits: 0, fee: 0, usage: 0 } };
    } else {
      // 通常の計算を実行
      powerSourceResult = await calculatePowerSource({
        tradeId,
        region: formData.region,
        contractCapacity,
        usage,
        year: formData.year,
        month: formData.month,
        governmentSupport,
        contractType: formData.contractType,
        contractCategory: formData.contractCategory,
        isZeroUsage
      });
      serviceChargeResult = await calculateServiceCharge(usage, formData.year, formData.month);
      takusoVolumeResult = await calculateTakusoVolume({
        tradeId,
        region: formData.region,
        contractCapacity,
        usage,
        year: formData.year,
        month: formData.month,
        governmentSupport,
        contractType: formData.contractType,
        contractCategory: formData.contractCategory,
        isZeroUsage
      });
      renewableSurchargeResult = await calculateRenewableSurcharge(usage, formData.year, formData.month);
      incentiveResult = await calculateIncentive({
        tradeId,
        region: formData.region,
        contractCapacity,
        usage,
        year: formData.year,
        month: formData.month,
        governmentSupport,
        contractType: formData.contractType,
        contractCategory: formData.contractCategory,
        isZeroUsage
      });
    }

    // 使用量が0の場合の基本料金半額処理
    let finalTakusoBasic = takusoBasicResult.amount;
    let finalCapacityContribution = capacityContributionResult.amount;

    if (isZeroUsage) {
      finalTakusoBasic = takusoBasicResult.amount * CONSTANTS.ZERO_USAGE_DISCOUNT;
      finalCapacityContribution = capacityContributionResult.amount * CONSTANTS.ZERO_USAGE_DISCOUNT;
    }

    // 小計を計算
    const subtotal = finalTakusoBasic + finalCapacityContribution + powerSourceResult.amount +
      serviceChargeResult.amount + takusoVolumeResult.amount + renewableSurchargeResult.amount;

    // 政府支援を計算
    // 使用量が0の場合、政府支援も0に設定
    let governmentSupportAmount = governmentSupport * usage;

    if (isZeroUsage) {
      governmentSupportAmount = 0;
    }

    // 合計を計算（インセンティブは別途表示するため小計には含めない）
    const total = subtotal - governmentSupportAmount;

    return {
      tradeName,
      takusoBasic: Math.floor(finalTakusoBasic),
      capacityContribution: Math.floor(finalCapacityContribution),
      powerSource: Math.floor(powerSourceResult.amount),
      serviceCharge: Math.floor(serviceChargeResult.amount),
      takusoVolume: Math.floor(takusoVolumeResult.amount),
      renewableSurcharge: Math.floor(renewableSurchargeResult.amount),
      incentive: Math.floor(incentiveResult.amount),
      subtotal: Math.floor(subtotal),
      governmentSupport: Math.floor(governmentSupportAmount),
      total: Math.floor(subtotal - governmentSupportAmount),
      details: {
        takusoBasic: takusoBasicResult.details,
        capacityContribution: capacityContributionResult.details,
        powerSource: powerSourceResult.details,
        serviceCharge: serviceChargeResult.details,
        takusoVolume: takusoVolumeResult.details,
        renewableSurcharge: renewableSurchargeResult.details,
        incentive: incentiveResult.details
      }
    };
  }, [
    formData.contractType,
    formData.contractCategory,
    formData.region,
    formData.usage,
    formData.year,
    formData.month,
    formData.governmentSupport,
    formData.contractCapacity,
    isZeroUsage,
    getContractCapacity,
    calculateTakusoBasic,
    calculateCapacityContribution,
    calculatePowerSource,
    calculateServiceCharge,
    calculateTakusoVolume,
    calculateRenewableSurcharge,
    calculateIncentive
  ]);

  // 計算実行関数（並列処理対応）
  const handleCalculate = useCallback(async () => {
    setIsCalculating(true);
    setError('');
    setCalculationResults([]);

    try {
      // 並列処理で全ての商流の計算を実行
      const calculationPromises = tradeList.map(async (trade) => {
        try {
          return await calculateForTrade(trade);
        } catch (error: any) {
          console.error(`${trade.tradeName}の計算でエラー:`, error);
          return null; // エラーが発生した商流はnullを返す
        }
      });

      // 全ての計算が完了するまで待機
      const results = await Promise.all(calculationPromises);

      // nullを除外して有効な結果のみを抽出
      const validResults = results.filter((result): result is CalculationResult => result !== null);

      if (validResults.length === 0) {
        throw new Error('計算可能な商流が見つかりませんでした');
      }

      // 合計金額でソート（安い順）
      validResults.sort((a, b) => a.total - b.total);

      setCalculationResults(validResults);

    } catch (error: any) {
      setError(error.message || '計算中にエラーが発生しました');
    } finally {
      setIsCalculating(false);
    }
  }, [tradeList, calculateForTrade]);

  // 入力変更ハンドラー
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = {
        ...prev,
        [name]: value
      };

      // 契約カテゴリが変更された場合の処理
      if (name === 'contractCategory') {
        if (value === CONSTANTS.CONTRACT_CATEGORIES.A) {
          // 従量Aの場合は契約容量を6kWに固定
          newData.contractCapacity = CONSTANTS.DEFAULT_VALUES.CONTRACT_CAPACITY_A.toString();
        } else if (value === CONSTANTS.CONTRACT_CATEGORIES.B && prev.contractCategory === CONSTANTS.CONTRACT_CATEGORIES.A) {
          // 従量AからBに変更した場合は8kWに設定
          newData.contractCapacity = CONSTANTS.DEFAULT_VALUES.CONTRACT_CAPACITY_B.toString();
        } else if (value === CONSTANTS.CONTRACT_CATEGORIES.C && prev.contractCategory === CONSTANTS.CONTRACT_CATEGORIES.A) {
          // 従量AからCに変更した場合は10kWに設定
          newData.contractCapacity = CONSTANTS.DEFAULT_VALUES.CONTRACT_CAPACITY_C.toString();
        }
      }

      // 契約種別が変更された場合の処理
      if (name === 'contractType') {
        // if (value === CONSTANTS.CONTRACT_TYPES.POWER) {
        //   // 動力の場合は契約容量を8kWに設定
        //   newData.contractCapacity = CONSTANTS.DEFAULT_VALUES.CONTRACT_CAPACITY_POWER.toString();
        // }
      }

      return newData;
    });
  }, []);

  // 使用量0フラグの変更ハンドラー
  const handleZeroUsageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setIsZeroUsage(e.target.checked);
  }, []);

  // 詳細表示の変更ハンドラー
  const handleShowDetailsChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setShowDetails(e.target.checked);
  }, []);

  // 現在価格の計算
  const currentPrice = useMemo(() => parseFloat(formData.currentPrice) || 0, [formData.currentPrice]);

  // 地域オプションの配列
  const regionOptions = useMemo(() => Object.values(CONSTANTS.REGIONS), []);

  // 年オプションの配列（2025年から現在の年まで）
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const startYear = 2025;
    const years: string[] = [];
    for (let year = startYear; year <= currentYear; year++) {
      years.push(year.toString());
    }
    return years;
  }, []);

  // 月オプションの配列
  const monthOptions = useMemo(() => Array.from({ length: 12 }, (_, i) => (i + 1).toString()), []);



  return (
    <Container>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title>入力画面</Title>
        <ManualLink href="https://docs.google.com/document/d/1OKdNuElBxrVLEGWJDkPCV1NIWDW8-SCjtSi6FuHza4A/edit?usp=sharing">手順書</ManualLink>
      </div>
      <form>
        <Row>
          <Select name="contractType" value={formData.contractType} onChange={handleInputChange}>
            <option>{CONSTANTS.CONTRACT_TYPES.VOLUME}</option>
            {/* <option>{CONSTANTS.CONTRACT_TYPES.POWER}</option> */}
          </Select>
          {/* 動力の選択肢をコメントアウトしたため、常に従量カテゴリを表示 */}
          <Select name="contractCategory" value={formData.contractCategory} onChange={handleInputChange}>
            <option>{CONSTANTS.CONTRACT_CATEGORIES.A}</option>
            <option>{CONSTANTS.CONTRACT_CATEGORIES.B}</option>
            <option>{CONSTANTS.CONTRACT_CATEGORIES.C}</option>
          </Select>
          <Label>地域</Label>
          <Select name="region" value={formData.region} onChange={handleInputChange}>
            {regionOptions.map(region => (
              <option key={region} value={region}>{region}</option>
            ))}
          </Select>
        </Row>
        <Row>
          <Label>契約容量</Label>
          {formData.contractCategory === CONSTANTS.CONTRACT_CATEGORIES.A ? (
            <span style={{ fontSize: '1rem', color: '#666' }}>{CONSTANTS.DEFAULT_VALUES.CONTRACT_CAPACITY_A}kW</span>
          ) : (
            <>
              <Input
                type="number"
                min="1"
                step="0.1"
                name="contractCapacity"
                value={formData.contractCapacity}
                onChange={handleInputChange}
                style={{ width: '80px' }}
              />
              <span>kW</span>
            </>
          )}
        </Row>
        <Row>
          <Label>使用量</Label>
          <Input
            type="number"
            min="0"
            name="usage"
            value={formData.usage}
            onChange={handleInputChange}
          />
          <span>kwh</span>
          <Checkbox
            type="checkbox"
            id="zero"
            checked={isZeroUsage}
            onChange={handleZeroUsageChange}
          />
          <Label htmlFor="zero" style={{ minWidth: 'auto', fontSize: '0.95rem' }}>使用量が0の場合</Label>
        </Row>
        <Row>
          <Label>現在(税込)</Label>
          <Input
            type="number"
            min="0"
            name="currentPrice"
            value={formData.currentPrice}
            onChange={handleInputChange}
          />
          <span>円</span>
        </Row>
        <Row>
          <Select style={{ width: '80px' }} name="year" value={formData.year} onChange={handleInputChange}>
            {yearOptions.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </Select>
          <span>年</span>
          <Select style={{ width: '60px' }} name="month" value={formData.month} onChange={handleInputChange}>
            {monthOptions.map(month => (
              <option key={month} value={month}>{month}</option>
            ))}
          </Select>
          <span>月</span>
          <Label style={{ minWidth: 'auto' }}>政府支援</Label>
          <Input
            type="number"
            min="0"
            style={{ width: '70px' }}
            name="governmentSupport"
            value={formData.governmentSupport}
            onChange={handleInputChange}
          />
          <span>円</span>
        </Row>
        {/* <Row>
          <Label style={{ minWidth: '40px' }}>朝</Label>
          <SmallInput 
            type="number" 
            min="0" 
            max="100" 
            name="morningPercent"
            value={formData.morningPercent}
            onChange={handleInputChange}
          />
          <span>%</span>
          <Label style={{ minWidth: '40px' }}>昼</Label>
          <SmallInput 
            type="number" 
            min="0" 
            max="100" 
            name="daytimePercent"
            value={formData.daytimePercent}
            onChange={handleInputChange}
          />
          <span>%</span>
          <Label style={{ minWidth: '40px' }}>夜</Label>
          <SmallInput 
            type="number" 
            min="0" 
            max="100" 
            name="nightPercent"
            value={formData.nightPercent}
            onChange={handleInputChange}
          />
          <span>%</span>
        </Row> */}
        <Row>
          <Label style={{ minWidth: 'auto' }}>検針日</Label>
          <DateInput
            type="date"
            name="meterReadingStart"
            value={formData.meterReadingStart}
            onChange={handleInputChange}
          />
          <span>～</span>
          <DateInput
            type="date"
            name="meterReadingEnd"
            value={formData.meterReadingEnd}
            onChange={handleInputChange}
          />
        </Row>
        <Button type="button" onClick={handleCalculate} disabled={isCalculating}>
          {isCalculating ? '計算中...' : '計算'}
        </Button>
      </form>

      {isLoading && (
        <LoadingMessage>商流一覧を読み込み中...</LoadingMessage>
      )}

      {tradeError && (
        <ErrorMessage>{tradeError}</ErrorMessage>
      )}

      {calculationResults.length > 0 && (
        <ResultContainer>
          <ResultHeader>
            <ResultTitle>計算結果</ResultTitle>
            <SwitchContainer>
              <FormControlLabel
                control={
                  <Switch
                    checked={showDetails}
                    onChange={handleShowDetailsChange}
                    size="small"
                  />
                }
                label="詳細表示"
                labelPlacement="start"
              />
            </SwitchContainer>
          </ResultHeader>

          {calculationResults.map((result, index) => {
            const isSavings = result.total < currentPrice;

            return (
              <TradeResultContainer key={index}>
                {isSavings ? (
                  <SavingsTradeResultHeader onClick={() => toggleTradeExpansion(result.tradeName)}>
                    <ResultLabel>
                      {result.tradeName}
                      <span style={{ marginLeft: '0.5rem', fontSize: '0.9rem', color: '#2e7d32' }}>
                        ({result.incentive.toLocaleString()}円)
                      </span>
                    </ResultLabel>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <SavingsResultValue>{result.total.toLocaleString()}円</SavingsResultValue>
                      <ExpandButton size="small">
                        {expandedTrades.has(result.tradeName) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </ExpandButton>
                    </div>
                  </SavingsTradeResultHeader>
                ) : (
                  <TradeResultHeader onClick={() => toggleTradeExpansion(result.tradeName)}>
                    <ResultLabel>
                      {result.tradeName}
                      <span style={{ marginLeft: '0.5rem', fontSize: '0.9rem', color: '#2e7d32' }}>
                        ({result.incentive.toLocaleString()}円)
                      </span>
                    </ResultLabel>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <ResultValue>{result.total.toLocaleString()}円</ResultValue>
                      <ExpandButton size="small">
                        {expandedTrades.has(result.tradeName) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </ExpandButton>
                    </div>
                  </TradeResultHeader>
                )}

                <TradeResultContent $isExpanded={expandedTrades.has(result.tradeName)}>
                  <TradeResultDetails>
                    <ResultRow>
                      <ResultLabel>①託送基本料</ResultLabel>
                      <ResultValue>{result.takusoBasic.toLocaleString()}円</ResultValue>
                    </ResultRow>
                    {showDetails && (
                      <DetailContainer>
                        <DetailRow>
                          <DetailLabel>契約容量:</DetailLabel>
                          <DetailValue>{result.details.takusoBasic.contractCapacity}kW</DetailValue>
                        </DetailRow>
                        {result.details.takusoBasic.basicPriceType === 'per_kw' ? (
                          <>
                            <DetailRow>
                              <DetailLabel>1kW毎単価:</DetailLabel>
                              <DetailValue>{result.details.takusoBasic.basicPrice}円/kW</DetailValue>
                            </DetailRow>
                            <CalculationFormula>
                              {result.details.takusoBasic.basicPrice}円/kW × {result.details.takusoBasic.contractCapacity}kW = {result.takusoBasic.toLocaleString()}円
                              {isZeroUsage && ' (使用量0のため半額)'}
                            </CalculationFormula>
                          </>
                        ) : (
                          <>
                            <DetailRow>
                              <DetailLabel>最初6kW料金:</DetailLabel>
                              <DetailValue>{result.details.takusoBasic.basicPriceFirst6kw}円</DetailValue>
                            </DetailRow>
                            <DetailRow>
                              <DetailLabel>6kW～単価:</DetailLabel>
                              <DetailValue>{result.details.takusoBasic.basicPriceOver6kw}円/kW</DetailValue>
                            </DetailRow>
                            <CalculationFormula>
                              {result.details.takusoBasic.basicPriceFirst6kw}円 + {result.details.takusoBasic.basicPriceOver6kw}円/kW × ({result.details.takusoBasic.contractCapacity}kW - 6kW) = {result.takusoBasic.toLocaleString()}円
                              {isZeroUsage && ' (使用量0のため半額)'}
                            </CalculationFormula>
                          </>
                        )}
                      </DetailContainer>
                    )}

                    <ResultRow>
                      <ResultLabel>②容量拠出金</ResultLabel>
                      <ResultValue>{result.capacityContribution.toLocaleString()}円</ResultValue>
                    </ResultRow>
                    {showDetails && (
                      <DetailContainer>
                        <DetailRow>
                          <DetailLabel>容量拠出金単価:</DetailLabel>
                          <DetailValue>{result.details.capacityContribution.price}円/kW</DetailValue>
                        </DetailRow>
                        <DetailRow>
                          <DetailLabel>契約容量:</DetailLabel>
                          <DetailValue>{result.details.capacityContribution.contractCapacity}kW</DetailValue>
                        </DetailRow>
                        <CalculationFormula>
                          {result.details.capacityContribution.price}円/kW × {result.details.capacityContribution.contractCapacity}kW = {result.capacityContribution.toLocaleString()}円
                          {isZeroUsage && ' (使用量0のため半額)'}
                        </CalculationFormula>
                      </DetailContainer>
                    )}

                    <ResultRow>
                      <ResultLabel>③電源料金</ResultLabel>
                      <ResultValue>{result.powerSource.toLocaleString()}円</ResultValue>
                    </ResultRow>
                    {showDetails && (
                      <DetailContainer>
                        <DetailRow>
                          <DetailLabel>Jepx月平均料金:</DetailLabel>
                          <DetailValue>{result.details.powerSource.jepxPrice}円/kWh</DetailValue>
                        </DetailRow>
                        <DetailRow>
                          <DetailLabel>エリア損失率:</DetailLabel>
                          <DetailValue>{result.details.powerSource.areaLossRate}%</DetailValue>
                        </DetailRow>
                        <DetailRow>
                          <DetailLabel>使用量:</DetailLabel>
                          <DetailValue>{result.details.powerSource.usage}kWh</DetailValue>
                        </DetailRow>
                        <CalculationFormula>
                          ({result.details.powerSource.usage}kWh × {result.details.powerSource.jepxPrice}円/kWh ÷ (1 - {result.details.powerSource.areaLossRate / 100})) × 1.1 = {result.powerSource.toLocaleString()}円
                          {isZeroUsage && ' (使用量0のため0円)'}
                        </CalculationFormula>
                      </DetailContainer>
                    )}

                    <ResultRow>
                      <ResultLabel>④サービス料</ResultLabel>
                      <ResultValue>{result.serviceCharge.toLocaleString()}円</ResultValue>
                    </ResultRow>
                    {showDetails && (
                      <DetailContainer>
                        <DetailRow>
                          <DetailLabel>サービス料単価:</DetailLabel>
                          <DetailValue>{result.details.serviceCharge.price}円/kWh</DetailValue>
                        </DetailRow>
                        <DetailRow>
                          <DetailLabel>使用量:</DetailLabel>
                          <DetailValue>{result.details.serviceCharge.usage}kWh</DetailValue>
                        </DetailRow>
                        <CalculationFormula>
                          {result.details.serviceCharge.price}円/kWh × {result.details.serviceCharge.usage}kWh = {result.serviceCharge.toLocaleString()}円
                          {isZeroUsage && ' (使用量0のため0円)'}
                        </CalculationFormula>
                      </DetailContainer>
                    )}

                    <ResultRow>
                      <ResultLabel>⑤託送従量料金</ResultLabel>
                      <ResultValue>{result.takusoVolume.toLocaleString()}円</ResultValue>
                    </ResultRow>
                    {showDetails && (
                      <DetailContainer>
                        <DetailRow>
                          <DetailLabel>託送従量単価:</DetailLabel>
                          <DetailValue>{result.details.takusoVolume.price}円/kWh</DetailValue>
                        </DetailRow>
                        <DetailRow>
                          <DetailLabel>使用量:</DetailLabel>
                          <DetailValue>{result.details.takusoVolume.usage}kWh</DetailValue>
                        </DetailRow>
                        <CalculationFormula>
                          {result.details.takusoVolume.price}円/kWh × {result.details.takusoVolume.usage}kWh = {result.takusoVolume.toLocaleString()}円
                          {isZeroUsage && ' (使用量0のため0円)'}
                        </CalculationFormula>
                      </DetailContainer>
                    )}

                    <ResultRow>
                      <ResultLabel>⑥再エネ賦課金</ResultLabel>
                      <ResultValue>{result.renewableSurcharge.toLocaleString()}円</ResultValue>
                    </ResultRow>
                    {showDetails && (
                      <DetailContainer>
                        <DetailRow>
                          <DetailLabel>再エネ賦課金単価:</DetailLabel>
                          <DetailValue>{result.details.renewableSurcharge.price}円/kWh</DetailValue>
                        </DetailRow>
                        <DetailRow>
                          <DetailLabel>使用量:</DetailLabel>
                          <DetailValue>{result.details.renewableSurcharge.usage}kWh</DetailValue>
                        </DetailRow>
                        <CalculationFormula>
                          {result.details.renewableSurcharge.price}円/kWh × {result.details.renewableSurcharge.usage}kWh = {result.renewableSurcharge.toLocaleString()}円
                          {isZeroUsage && ' (使用量0のため0円)'}
                        </CalculationFormula>
                      </DetailContainer>
                    )}

                    <ResultRow>
                      <ResultLabel>⑦小計（①～⑥の合計）</ResultLabel>
                      <ResultValue>{result.subtotal.toLocaleString()}円</ResultValue>
                    </ResultRow>
                    {showDetails && (
                      <DetailContainer>
                        <CalculationFormula>
                          {result.takusoBasic.toLocaleString()} + {result.capacityContribution.toLocaleString()} + {result.powerSource.toLocaleString()} + {result.serviceCharge.toLocaleString()} + {result.takusoVolume.toLocaleString()} + {result.renewableSurcharge.toLocaleString()} = {result.subtotal.toLocaleString()}円
                        </CalculationFormula>
                      </DetailContainer>
                    )}

                    <ResultRow>
                      <ResultLabel>政府支援控除</ResultLabel>
                      <ResultValue>-{result.governmentSupport.toLocaleString()}円</ResultValue>
                    </ResultRow>
                    {showDetails && (
                      <DetailContainer>
                        <DetailRow>
                          <DetailLabel>政府支援単価:</DetailLabel>
                          <DetailValue>{formData.governmentSupport}円/kWh</DetailValue>
                        </DetailRow>
                        <DetailRow>
                          <DetailLabel>使用量:</DetailLabel>
                          <DetailValue>{formData.usage}kWh</DetailValue>
                        </DetailRow>
                        <CalculationFormula>
                          {formData.governmentSupport}円/kWh × {formData.usage}kWh = {result.governmentSupport.toLocaleString()}円
                          {isZeroUsage && ' (使用量0のため0円)'}
                        </CalculationFormula>
                      </DetailContainer>
                    )}

                    <TotalRow>
                      <ResultLabel>⑨合計金額</ResultLabel>
                      <ResultValue>{result.total.toLocaleString()}円</ResultValue>
                    </TotalRow>
                    {showDetails && (
                      <DetailContainer>
                        <CalculationFormula>
                          {result.subtotal.toLocaleString()}円 - {result.governmentSupport.toLocaleString()}円 = {result.total.toLocaleString()}円
                        </CalculationFormula>
                      </DetailContainer>
                    )}

                    <ResultRow>
                      <ResultLabel>インセンティブ</ResultLabel>
                      <ResultValue style={{ color: '#2e7d32' }}>{result.incentive.toLocaleString()}円</ResultValue>
                    </ResultRow>
                    {showDetails && (
                      <DetailContainer>
                        <DetailRow>
                          <DetailLabel>{formData.month}月の指数:</DetailLabel>
                          <DetailValue>{result.details.incentive.monthlyIndex}</DetailValue>
                        </DetailRow>
                        <DetailRow>
                          <DetailLabel>獲得件数:</DetailLabel>
                          <DetailValue>{result.details.incentive.acquiredUnits.toFixed(2)}件</DetailValue>
                        </DetailRow>
                        <DetailRow>
                          <DetailLabel>手数料:</DetailLabel>
                          <DetailValue>{result.details.incentive.fee}円</DetailValue>
                        </DetailRow>
                        <CalculationFormula>
                          {formData.usage}kWh × {result.details.incentive.monthlyIndex} = {result.details.incentive.acquiredUnits.toFixed(2)}件 → {result.incentive.toLocaleString()}円
                          {isZeroUsage && ' (使用量0のため0円)'}
                        </CalculationFormula>
                      </DetailContainer>
                    )}
                  </TradeResultDetails>
                </TradeResultContent>
              </TradeResultContainer>
            );
          })}
        </ResultContainer>
      )}
    </Container>
  );
};

export default SimulationForm; 