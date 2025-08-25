import { useState, useEffect, useCallback } from 'react';
import { dataService } from '../utils/dataService.ts';
import { DataType, ModalData } from '../types/index.ts';

interface UseDataManagementProps {
  dataType: DataType;
  startDate?: string;
  endDate?: string;
}

interface UseDataManagementReturn {
  data: any[];
  isLoading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  createData: (data: any) => Promise<string>;
  updateData: (id: string, data: any) => Promise<void>;
  deleteData: (id: string) => Promise<void>;
}

export const useDataManagement = ({ 
  dataType, 
  startDate, 
  endDate 
}: UseDataManagementProps): UseDataManagementReturn => {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await dataService.getDataByType(dataType, startDate, endDate);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'データの取得に失敗しました');
      console.error('データ取得エラー:', err);
    } finally {
      setIsLoading(false);
    }
  }, [dataType, startDate, endDate]);

  const createData = useCallback(async (dataToCreate: any): Promise<string> => {
    try {
      let result: string;
      
      switch (dataType) {
        case DataType.TRADE_NAME:
          result = await dataService.createTrade(dataToCreate);
          break;
        case DataType.FUEL_ADJUSTMENT:
          result = await dataService.createFuelAdjustment(dataToCreate);
          break;
        case DataType.TAKUSO_PRICE:
          result = await dataService.createTakusoPrice(dataToCreate);
          break;
        case DataType.CAPACITY_CONTRIBUTION:
          result = await dataService.createCapacityContribution(dataToCreate);
          break;
        case DataType.SERVICE_CHARGE:
          result = await dataService.createServiceCharge(dataToCreate);
          break;
        case DataType.RENEWABLE_SURCHARGE:
          result = await dataService.createRenewableSurcharge(dataToCreate);
          break;
        case DataType.INCENTIVE:
          result = await dataService.createIncentive(dataToCreate);
          break;
        case DataType.JEPX:
          await dataService.createJepxDataBatch(dataToCreate);
          result = 'success';
          break;
        default:
          throw new Error(`未対応のデータタイプ: ${dataType}`);
      }
      
      await fetchData(); // データを再取得
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'データの作成に失敗しました');
      throw err;
    }
  }, [dataType, fetchData]);

  const updateData = useCallback(async (id: string, dataToUpdate: any): Promise<void> => {
    try {
      if (dataType === DataType.TRADE_NAME) {
        await dataService.updateTrade(id, dataToUpdate);
      } else if (dataType === DataType.INCENTIVE) {
        await dataService.updateIncentive(id, dataToUpdate);
      } else {
        // 他のデータタイプの更新処理を追加
        throw new Error('更新機能は現在商流データとインセンティブデータのみ対応しています');
      }
      
      await fetchData(); // データを再取得
    } catch (err) {
      setError(err instanceof Error ? err.message : 'データの更新に失敗しました');
      throw err;
    }
  }, [dataType, fetchData]);

  const deleteData = useCallback(async (id: string): Promise<void> => {
    try {
      await dataService.deleteDataByType(dataType, id);
      await fetchData(); // データを再取得
    } catch (err) {
      setError(err instanceof Error ? err.message : 'データの削除に失敗しました');
      throw err;
    }
  }, [dataType, fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
    refreshData: fetchData,
    createData,
    updateData,
    deleteData
  };
};

// モーダルデータ管理用のカスタムフック
export const useModalData = () => {
  const [modalData, setModalData] = useState<ModalData>({
    tradeName: '',
    registrationDate: '',
    iconImage: null,
    flow: '',
    region: '',
    contract: '',
    areaLossRate: '',
    startDate: '',
    basicPrice: '',
    basicPriceFirst6kw: '',
    basicPriceOver6kw: '',
    basicPriceType: 'per_kw',
    volumePrice: '',
    price: '',
    servicePrice: '',
    // インセンティブ関連
    monthlyIndices: {},
    feeTable: [],
    incentiveType: 'feeTable',
    flatRateFee: '',
    minimumAcquisition: '',
  });

  const updateModalData = useCallback((field: keyof ModalData, value: any) => {
    setModalData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const resetModalData = useCallback(() => {
    setModalData({
      tradeName: '',
      registrationDate: '',
      iconImage: null,
      flow: '',
      region: '',
      contract: '',
      areaLossRate: '',
      startDate: '',
      basicPrice: '',
      basicPriceFirst6kw: '',
      basicPriceOver6kw: '',
      basicPriceType: 'per_kw',
      volumePrice: '',
      price: '',
      servicePrice: '',
      // インセンティブ関連
      monthlyIndices: {},
      feeTable: [],
      incentiveType: 'feeTable',
      flatRateFee: '',
      minimumAcquisition: '',
    });
  }, []);

  const setModalDataForEdit = useCallback((data: any) => {
    setModalData({
      tradeName: data.tradeName || '',
      registrationDate: data.registrationDate || '',
      iconImage: null,
      flow: data.tradeId || '',
      region: data.region || '',
      contract: data.contract || '',
      areaLossRate: data.areaLossRate || '',
      startDate: data.startDate || '',
      basicPrice: data.basicPrice || '',
      basicPriceFirst6kw: data.basicPriceFirst6kw || '',
      basicPriceOver6kw: data.basicPriceOver6kw || '',
      basicPriceType: data.basicPriceType || 'per_kw',
      volumePrice: data.volumePrice || '',
      price: data.price || '',
      servicePrice: data.servicePrice || '',
      // インセンティブ関連
      monthlyIndices: data.monthlyIndices || {},
      feeTable: data.feeTable ? data.feeTable.map((fee: any) => ({
        ...fee,
        maxKwh: fee.maxKwh === Infinity ? '' : fee.maxKwh.toString()
      })) : [],
      incentiveType: data.incentiveType || 'feeTable',
      flatRateFee: data.flatRate?.fee?.toString() || '',
      minimumAcquisition: data.flatRate?.minimumAcquisition?.toString() || '',
    });
  }, []);

  return {
    modalData,
    updateModalData,
    resetModalData,
    setModalDataForEdit
  };
}; 