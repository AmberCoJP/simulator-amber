import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase/index.ts';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import IconButton from '@mui/material/IconButton';

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

const TradeResultContent = styled.div<{ isExpanded: boolean }>`
  max-height: ${(props: { isExpanded: boolean }) => props.isExpanded ? '2000px' : '0'};
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

interface CalculationResult {
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
  details: {
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
  };
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

const SimulationForm: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    contractType: '従量',
    contractCategory: 'B',
    region: '関西',
    usage: '801',
    currentPrice: '',
    year: '2025',
    month: '4',
    governmentSupport: '2.5',
    morningPercent: '',
    daytimePercent: '',
    nightPercent: '',
    meterReadingStart: '',
    meterReadingEnd: '',
    contractCapacity: '8'
  });

  const [calculationResults, setCalculationResults] = useState<CalculationResult[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string>('');
  const [showDetails, setShowDetails] = useState(false);
  const [tradeList, setTradeList] = useState<any[]>([]);
  const [tradeNameMap, setTradeNameMap] = useState<{[key: string]: string}>({});
  const [expandedTrades, setExpandedTrades] = useState<Set<string>>(new Set());

  // 商流一覧を取得
  const fetchTradeList = async () => {
    try {
      const q = query(collection(db, 'trend'), orderBy('tradeName', 'asc'));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTradeList(data);
      
      console.log('取得した商流一覧:', data);
      
      // IDと商流名のマッピングを作成
      const nameMap: {[key: string]: string} = {};
      data.forEach((trade: any) => {
        nameMap[trade.tradeId || trade.id] = trade.tradeName;
      });
      setTradeNameMap(nameMap);
      
      console.log('商流名マッピング:', nameMap);
    } catch (error) {
      console.error('商流一覧取得エラー:', error);
    }
  };

  // コンポーネントマウント時に商流一覧を取得
  useEffect(() => {
    fetchTradeList();
  }, []);

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

  // 契約容量を取得する関数
  const getContractCapacity = (contractType: string, contractCategory: string, contractCapacity: string): number => {
    if (contractType === '従量' && contractCategory === 'A') {
      return 6; // 従量Aは6kW固定
    } else {
      // 従量B、C、動力は入力値を使用
      return parseFloat(contractCapacity) || 8;
    }
  };

  // 託送基本料を計算する関数
  const calculateTakusoBasic = async (tradeId: string, region: string, contractCapacity: number, year: string, month: string): Promise<{amount: number, details: any}> => {
    try {
      // 契約種別とカテゴリーを組み合わせて決定
      let contractType = '';
      if (formData.contractType === '従量') {
        contractType = `従量${formData.contractCategory}`;
      } else {
        contractType = '動力';
      }
      
      // 地域名をデータベース用の値に変換
      const regionMap: {[key: string]: string} = {
        '北海道': 'hokkaido',
        '東北': 'tohoku',
        '関東': 'tokyo',
        '中部': 'chubu',
        '北陸': 'hokuriku',
        '関西': 'kansai',
        '中国': 'chugoku',
        '四国': 'shikoku',
        '九州': 'kyushu'
      };
      const dbRegion = regionMap[region] || region;
      
      console.log('託送基本料検索条件:', {
        tradeId,
        region: dbRegion,
        contract: contractType,
        startDate: `${year}-${month.padStart(2, '0')}-01`
      });
      
      // takuso_priceコレクションのすべてのデータを取得して表示
      const allTakusoQuery = query(collection(db, 'takuso_price'));
      const allTakusoSnapshot = await getDocs(allTakusoQuery);
      console.log('takuso_priceコレクション全件データ:');
      allTakusoSnapshot.docs.forEach((doc, index) => {
        console.log(`[${index + 1}]`, doc.data());
      });
      
      const q = query(
        collection(db, 'takuso_price'),
        where('tradeId', '==', tradeId),
        where('region', '==', dbRegion),
        where('contract', '==', contractType),
        where('startDate', '<=', `${year}-${month.padStart(2, '0')}-01`),
        orderBy('startDate', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      console.log('託送基本料検索結果件数:', querySnapshot.size);
      
      // 託送データを全件表示
      console.log('託送基本料データ全件:');
      querySnapshot.docs.forEach((doc, index) => {
        console.log(`[${index + 1}]`, doc.data());
      });
      
      if (querySnapshot.empty) {
        const tradeName = tradeNameMap[tradeId] || tradeId;
        throw new Error(`${tradeName}の${region}託送基本料データが見つかりません`);
      }

      const data = querySnapshot.docs[0].data();
      let amount = 0;
      let details: any = {
        basicPriceType: data.basicPriceType,
        contractCapacity
      };
      
      if (data.basicPriceType === 'per_kw') {
        amount = parseFloat(data.basicPrice) * contractCapacity;
        details.basicPrice = parseFloat(data.basicPrice);
      } else if (data.basicPriceType === 'tiered') {
        const first6kwPrice = parseFloat(data.basicPriceFirst6kw);
        const over6kwPrice = parseFloat(data.basicPriceOver6kw);
        amount = first6kwPrice + (contractCapacity - 6) * over6kwPrice;
        details.basicPriceFirst6kw = first6kwPrice;
        details.basicPriceOver6kw = over6kwPrice;
      }
      
      return { amount, details };
    } catch (error) {
      console.error('託送基本料計算エラー:', error);
      throw error;
    }
  };

  // 容量拠出金を計算する関数
  const calculateCapacityContribution = async (tradeId: string, region: string, contractCapacity: number, year: string, month: string): Promise<{amount: number, details: any}> => {
    try {
      // 契約種別とカテゴリーを組み合わせて決定
      let contractType = '';
      if (formData.contractType === '従量') {
        contractType = `従量${formData.contractCategory}`;
      } else {
        contractType = '動力';
      }
      
      // 地域名をデータベース用の値に変換
      const regionMap: {[key: string]: string} = {
        '北海道': 'hokkaido',
        '東北': 'tohoku',
        '関東': 'tokyo',
        '中部': 'chubu',
        '北陸': 'hokuriku',
        '関西': 'kansai',
        '中国': 'chugoku',
        '四国': 'shikoku',
        '九州': 'kyushu'
      };
      const dbRegion = regionMap[region] || region;
      
      const q = query(
        collection(db, 'yoryo_price'),
        where('tradeId', '==', tradeId),
        where('region', '==', dbRegion),
        where('contract', '==', contractType),
        where('startDate', '<=', `${year}-${month.padStart(2, '0')}-01`),
        orderBy('startDate', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        const tradeName = tradeNameMap[tradeId] || tradeId;
        throw new Error(`${tradeName}の${region}容量拠出金データが見つかりません`);
      }

      const data = querySnapshot.docs[0].data();
      const price = parseFloat(data.price);
      const amount = price * contractCapacity;
      
      return { 
        amount, 
        details: { price, contractCapacity }
      };
    } catch (error) {
      console.error('容量拠出金計算エラー:', error);
      throw error;
    }
  };

  // 電源料金を計算する関数
  const calculatePowerSource = async (tradeId: string, region: string, usage: number, year: string, month: string): Promise<{amount: number, details: any}> => {
    try {
      // Jepx月平均料金を取得
      const jepxQuery = query(
        collection(db, 'jepx_monthly_data'),
        where('date', '==', `${year}-${month.padStart(2, '0')}`)
      );
      const jepxSnapshot = await getDocs(jepxQuery);
      
      if (jepxSnapshot.empty) {
        throw new Error(`${year}年${month}月のJepxデータが見つかりません`);
      }

      const jepxData = jepxSnapshot.docs[0].data();
      const areaKey = region === '関西' ? 'kansai' : 
                     region === '関東' ? 'tokyo' : 
                     region === '中部' ? 'chubu' : 
                     region === '九州' ? 'kyushu' : 
                     region === '北海道' ? 'hokkaido' : 
                     region === '東北' ? 'tohoku' : 
                     region === '中国' ? 'chugoku' : 
                     region === '四国' ? 'shikoku' : 
                     region === '北陸' ? 'hokuriku' : 'kansai';
      
      const jepxPrice = jepxData.areaAverages[areaKey];

      // エリア損失率を取得
      let contractType = '';
      if (formData.contractType === '従量') {
        contractType = `従量${formData.contractCategory}`;
      } else {
        contractType = '動力';
      }
      
      // 地域名をデータベース用の値に変換
      const regionMap: {[key: string]: string} = {
        '北海道': 'hokkaido',
        '東北': 'tohoku',
        '関東': 'tokyo',
        '中部': 'chubu',
        '北陸': 'hokuriku',
        '関西': 'kansai',
        '中国': 'chugoku',
        '四国': 'shikoku',
        '九州': 'kyushu'
      };
      const dbRegion = regionMap[region] || region;
      
      const lossQuery = query(
        collection(db, 'fuel_adjustment'),
        where('tradeId', '==', tradeId),
        where('region', '==', dbRegion),
        where('contract', '==', contractType),
        where('startDate', '<=', `${year}-${month.padStart(2, '0')}-01`),
        orderBy('startDate', 'desc')
      );
      const lossSnapshot = await getDocs(lossQuery);
      
      if (lossSnapshot.empty) {
        const tradeName = tradeNameMap[tradeId] || tradeId;
        throw new Error(`${tradeName}の${region}エリア損失率データが見つかりません`);
      }

      const lossData = lossSnapshot.docs[0].data();
      const areaLossRate = parseFloat(lossData.areaLossRate) / 100; // パーセンテージを小数に変換

      const amount = (jepxPrice * (1 - areaLossRate) * usage) * 1.1; // 消費税10%を加算

      // const areaLossRate = parseFloat(lossData.areaLossRate); // パーセンテージを小数に変換

      // const amount = jepxPrice * areaLossRate * usage; // 消費税10%を加算
      
      return { 
        amount, 
        details: { jepxPrice, areaLossRate: parseFloat(lossData.areaLossRate), usage } // 表示用には元のパーセンテージ値を保持
      };
    } catch (error) {
      console.error('電源料金計算エラー:', error);
      throw error;
    }
  };

  // サービス料を計算する関数
  const calculateServiceCharge = async (usage: number, year: string, month: string): Promise<{amount: number, details: any}> => {
    try {
      const q = query(
        collection(db, 'service_charge'),
        where('startDate', '<=', `${year}-${month.padStart(2, '0')}-01`),
        orderBy('startDate', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        throw new Error('サービス料データが見つかりません');
      }

      const data = querySnapshot.docs[0].data();
      const price = parseFloat(data.price);
      const amount = price * usage;
      
      return { 
        amount, 
        details: { price, usage }
      };
    } catch (error) {
      console.error('サービス料計算エラー:', error);
      throw error;
    }
  };

  // 託送従量料金を計算する関数
  const calculateTakusoVolume = async (tradeId: string, region: string, usage: number, year: string, month: string): Promise<{amount: number, details: any}> => {
    try {
      // 契約種別とカテゴリーを組み合わせて決定
      let contractType = '';
      if (formData.contractType === '従量') {
        contractType = `従量${formData.contractCategory}`;
      } else {
        contractType = '動力';
      }
      
      // 地域名をデータベース用の値に変換
      const regionMap: {[key: string]: string} = {
        '北海道': 'hokkaido',
        '東北': 'tohoku',
        '関東': 'tokyo',
        '中部': 'chubu',
        '北陸': 'hokuriku',
        '関西': 'kansai',
        '中国': 'chugoku',
        '四国': 'shikoku',
        '九州': 'kyushu'
      };
      const dbRegion = regionMap[region] || region;
      
      const q = query(
        collection(db, 'takuso_price'),
        where('tradeId', '==', tradeId),
        where('region', '==', dbRegion),
        where('contract', '==', contractType),
        where('startDate', '<=', `${year}-${month.padStart(2, '0')}-01`),
        orderBy('startDate', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        const tradeName = tradeNameMap[tradeId] || tradeId;
        throw new Error(`${tradeName}の${region}託送従量料金データが見つかりません`);
      }

      const data = querySnapshot.docs[0].data();
      const price = parseFloat(data.volumePrice);
      const amount = price * usage;
      
      return { 
        amount, 
        details: { price, usage }
      };
    } catch (error) {
      console.error('託送従量料金計算エラー:', error);
      throw error;
    }
  };

  // 再エネ賦課金を計算する関数
  const calculateRenewableSurcharge = async (usage: number, year: string, month: string): Promise<{amount: number, details: any}> => {
    try {
      const q = query(
        collection(db, 'renewable_surcharge'),
        where('startDate', '<=', `${year}-${month.padStart(2, '0')}-01`),
        orderBy('startDate', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        throw new Error('再エネ賦課金データが見つかりません');
      }

      const data = querySnapshot.docs[0].data();
      const price = parseFloat(data.price);
      const amount = price * usage;
      
      return { 
        amount, 
        details: { price, usage }
      };
    } catch (error) {
      console.error('再エネ賦課金計算エラー:', error);
      throw error;
    }
  };

  // 単一の商流で計算を実行する関数
  const calculateForTrade = async (trade: any): Promise<CalculationResult> => {
    const tradeId = trade.tradeId || trade.id;
    const tradeName = trade.tradeName;
    const usage = parseFloat(formData.usage);
    const contractCapacity = getContractCapacity(formData.contractType, formData.contractCategory, formData.contractCapacity);
    const governmentSupport = parseFloat(formData.governmentSupport);

    // デバッグ用：計算に使用するパラメータをコンソールに出力
    console.log('=== 計算パラメータ ===');
    console.log('商流ID:', tradeId);
    console.log('商流名:', tradeName);
    console.log('地域:', formData.region);
    console.log('契約種別:', formData.contractType);
    console.log('契約カテゴリ:', formData.contractCategory);
    console.log('契約容量:', contractCapacity);
    console.log('使用量:', usage);
    console.log('年:', formData.year);
    console.log('月:', formData.month);
    console.log('政府支援:', governmentSupport);
    console.log('==================');

    // 各項目を計算
    const takusoBasicResult = await calculateTakusoBasic(tradeId, formData.region, contractCapacity, formData.year, formData.month);
    const capacityContributionResult = await calculateCapacityContribution(tradeId, formData.region, contractCapacity, formData.year, formData.month);
    const powerSourceResult = await calculatePowerSource(tradeId, formData.region, usage, formData.year, formData.month);
    const serviceChargeResult = await calculateServiceCharge(usage, formData.year, formData.month);
    const takusoVolumeResult = await calculateTakusoVolume(tradeId, formData.region, usage, formData.year, formData.month);
    const renewableSurchargeResult = await calculateRenewableSurcharge(usage, formData.year, formData.month);

    // 小計を計算
    const subtotal = takusoBasicResult.amount + capacityContributionResult.amount + powerSourceResult.amount + 
                    serviceChargeResult.amount + takusoVolumeResult.amount + renewableSurchargeResult.amount;
    
    // 政府支援を計算
    const governmentSupportAmount = governmentSupport * usage;
    
    // 合計を計算
    const total = subtotal - governmentSupportAmount;

    return {
      tradeName,
      takusoBasic: Math.floor(takusoBasicResult.amount),
      capacityContribution: Math.floor(capacityContributionResult.amount),
      powerSource: Math.floor(powerSourceResult.amount),
      serviceCharge: Math.floor(serviceChargeResult.amount),
      takusoVolume: Math.floor(takusoVolumeResult.amount),
      renewableSurcharge: Math.floor(renewableSurchargeResult.amount),
      subtotal: Math.floor(subtotal),
      governmentSupport: Math.floor(governmentSupportAmount),
      total: Math.floor(subtotal - governmentSupportAmount),
      details: {
        takusoBasic: takusoBasicResult.details,
        capacityContribution: capacityContributionResult.details,
        powerSource: powerSourceResult.details,
        serviceCharge: serviceChargeResult.details,
        takusoVolume: takusoVolumeResult.details,
        renewableSurcharge: renewableSurchargeResult.details
      }
    };
  };

  // 計算実行関数
  const handleCalculate = async () => {
    setIsCalculating(true);
    setError('');
    setCalculationResults([]);

    try {
      const results: CalculationResult[] = [];
      
      // 全ての商流で計算を実行
      for (const trade of tradeList) {
        try {
          const result = await calculateForTrade(trade);
          results.push(result);
        } catch (error: any) {
          console.error(`${trade.tradeName}の計算でエラー:`, error);
          // エラーが発生した商流はスキップして続行
        }
      }

      if (results.length === 0) {
        throw new Error('計算可能な商流が見つかりませんでした');
      }

      // 合計金額でソート（安い順）
      results.sort((a, b) => a.total - b.total);
      
      setCalculationResults(results);

    } catch (error: any) {
      setError(error.message || '計算中にエラーが発生しました');
    } finally {
      setIsCalculating(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = {
        ...prev,
        [name]: value
      };
      
      // 契約カテゴリが変更された場合の処理
      if (name === 'contractCategory') {
        if (value === 'A') {
          // 従量Aの場合は契約容量を6kWに固定
          newData.contractCapacity = '6';
        } else if (value === 'B' && prev.contractCategory === 'A') {
          // 従量AからBに変更した場合は8kWに設定
          newData.contractCapacity = '8';
        } else if (value === 'C' && prev.contractCategory === 'A') {
          // 従量AからCに変更した場合は10kWに設定
          newData.contractCapacity = '10';
        }
      }
      
      // 契約種別が変更された場合の処理
      if (name === 'contractType') {
        if (value === '動力') {
          // 動力の場合は契約容量を8kWに設定
          newData.contractCapacity = '8';
        }
      }
      
      return newData;
    });
  };

  return (
    <Container>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title>入力画面</Title>
        <ManualLink href="#">手順書</ManualLink>
      </div>
      <form>
        <Row>
          <Select name="contractType" value={formData.contractType} onChange={handleInputChange}>
            <option>従量</option>
            <option>動力</option>
          </Select>
          {formData.contractType === '従量' && (
            <Select name="contractCategory" value={formData.contractCategory} onChange={handleInputChange}>
              <option>A</option>
              <option>B</option>
              <option>C</option>
            </Select>
          )}
          <Label>地域</Label>
          <Select name="region" value={formData.region} onChange={handleInputChange}>
            <option>関西</option>
            <option>関東</option>
            <option>中部</option>
            <option>九州</option>
            <option>北海道</option>
            <option>東北</option>
            <option>中国</option>
            <option>四国</option>
            <option>北陸</option>
          </Select>
        </Row>
        <Row>
          <Label>契約容量</Label>
          {formData.contractType === '従量' && formData.contractCategory === 'A' ? (
            <span style={{ fontSize: '1rem', color: '#666' }}>6kW</span>
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
          <Checkbox type="checkbox" id="zero" />
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
            <option>2025</option>
            <option>2024</option>
          </Select>
          <span>年</span>
          <Select style={{ width: '60px' }} name="month" value={formData.month} onChange={handleInputChange}>
            <option>1</option>
            <option>2</option>
            <option>3</option>
            <option>4</option>
            <option>5</option>
            <option>6</option>
            <option>7</option>
            <option>8</option>
            <option>9</option>
            <option>10</option>
            <option>11</option>
            <option>12</option>
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
        <Row>
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
        </Row>
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

      {isCalculating && (
        <LoadingMessage>データを取得して計算中です...</LoadingMessage>
      )}

      {error && (
        <ErrorMessage>{error}</ErrorMessage>
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
                    onChange={(e) => setShowDetails(e.target.checked)}
                    size="small"
                  />
                }
                label="詳細表示"
                labelPlacement="start"
              />
            </SwitchContainer>
          </ResultHeader>
          
          {calculationResults.map((result, index) => {
            const currentPrice = parseFloat(formData.currentPrice) || 0;
            const isSavings = result.total < currentPrice;
            
            return (
              <TradeResultContainer key={index}>
                {isSavings ? (
                  <SavingsTradeResultHeader onClick={() => toggleTradeExpansion(result.tradeName)}>
                    <ResultLabel>
                      {result.tradeName}
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
                    <ResultLabel>{result.tradeName}</ResultLabel>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <ResultValue>{result.total.toLocaleString()}円</ResultValue>
                      <ExpandButton size="small">
                        {expandedTrades.has(result.tradeName) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </ExpandButton>
                    </div>
                  </TradeResultHeader>
                )}
              
              <TradeResultContent isExpanded={expandedTrades.has(result.tradeName)}>
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
                        ({result.details.powerSource.jepxPrice}円/kWh × (1 - {result.details.powerSource.areaLossRate / 100}) × {result.details.powerSource.usage}kWh) × 1.1 = {result.powerSource.toLocaleString()}円
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
                      </CalculationFormula>
                    </DetailContainer>
                  )}

                  <TotalRow>
                    <ResultLabel>⑧合計金額</ResultLabel>
                    <ResultValue>{result.total.toLocaleString()}円</ResultValue>
                  </TotalRow>
                  {showDetails && (
                    <DetailContainer>
                      <CalculationFormula>
                        {result.subtotal.toLocaleString()}円 - {result.governmentSupport.toLocaleString()}円 = {result.total.toLocaleString()}円
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