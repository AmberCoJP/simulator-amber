import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  getDocs, 
  query, 
  orderBy, 
  updateDoc, 
  doc, 
  setDoc, 
  where,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../firebase/index.ts';
import {
  Trade,
  FuelAdjustmentData,
  TakusoPriceData,
  CapacityContributionData,
  ServiceChargeData,
  RenewableSurchargeData,
  IncentiveData,
  JepxData,
  DataType
} from '../types/index.ts';

// 基本データアクセスクラス
class DataService {
  // 商流データの取得
  async getTradeList(): Promise<Trade[]> {
    try {
      const q = query(collection(db, 'trend'), orderBy('tradeName', 'asc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as any)
      })) as Trade[];
    } catch (error) {
      console.error('商流一覧取得エラー:', error);
      throw error;
    }
  }

  // 商流データの登録
  async createTrade(tradeData: Omit<Trade, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const data = {
        ...tradeData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      const docRef = await addDoc(collection(db, 'trend'), data);
      
      // 生成されたIDを商流IDとして更新
      await updateDoc(docRef, {
        tradeId: docRef.id
      });
      
      return docRef.id;
    } catch (error) {
      console.error('商流データ保存エラー:', error);
      throw error;
    }
  }

  // 商流データの更新
  async updateTrade(id: string, tradeData: Partial<Trade>): Promise<void> {
    try {
      const ref = doc(db, 'trend', id);
      await updateDoc(ref, {
        ...tradeData,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('商流データ更新エラー:', error);
      throw error;
    }
  }

  // 燃料調整費データの取得
  async getFuelAdjustmentData(): Promise<FuelAdjustmentData[]> {
    try {
      const q = query(collection(db, 'fuel_adjustment'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as any)
      })) as FuelAdjustmentData[];
    } catch (error) {
      console.error('燃料調整費データ取得エラー:', error);
      throw error;
    }
  }

  // 燃料調整費データの登録
  async createFuelAdjustment(data: Omit<FuelAdjustmentData, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const fuelData = {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      const docRef = await addDoc(collection(db, 'fuel_adjustment'), fuelData);
      return docRef.id;
    } catch (error) {
      console.error('燃料調整費データ保存エラー:', error);
      throw error;
    }
  }

  // 託送料金データの取得
  async getTakusoPriceData(): Promise<TakusoPriceData[]> {
    try {
      const q = query(collection(db, 'takuso_price'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as any)
      })) as TakusoPriceData[];
    } catch (error) {
      console.error('託送料金データ取得エラー:', error);
      throw error;
    }
  }

  // 託送料金データの登録
  async createTakusoPrice(data: Omit<TakusoPriceData, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const takusoData = {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      const docRef = await addDoc(collection(db, 'takuso_price'), takusoData);
      return docRef.id;
    } catch (error) {
      console.error('託送料金データ保存エラー:', error);
      throw error;
    }
  }

  // 容量拠出金データの取得
  async getCapacityContributionData(): Promise<CapacityContributionData[]> {
    try {
      const q = query(collection(db, 'yoryo_price'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as any)
      })) as CapacityContributionData[];
    } catch (error) {
      console.error('容量拠出金データ取得エラー:', error);
      throw error;
    }
  }

  // 容量拠出金データの登録
  async createCapacityContribution(data: Omit<CapacityContributionData, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const capacityData = {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      const docRef = await addDoc(collection(db, 'yoryo_price'), capacityData);
      return docRef.id;
    } catch (error) {
      console.error('容量拠出金データ保存エラー:', error);
      throw error;
    }
  }

  // サービス料データの取得
  async getServiceChargeData(): Promise<ServiceChargeData[]> {
    try {
      const q = query(collection(db, 'service_charge'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as any)
      })) as ServiceChargeData[];
    } catch (error) {
      console.error('サービス料データ取得エラー:', error);
      throw error;
    }
  }

  // サービス料データの登録
  async createServiceCharge(data: Omit<ServiceChargeData, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const serviceData = {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      const docRef = await addDoc(collection(db, 'service_charge'), serviceData);
      return docRef.id;
    } catch (error) {
      console.error('サービス料データ保存エラー:', error);
      throw error;
    }
  }

  // 再エネ賦課金データの取得
  async getRenewableSurchargeData(): Promise<RenewableSurchargeData[]> {
    try {
      const q = query(collection(db, 'renewable_surcharge'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as any)
      })) as RenewableSurchargeData[];
    } catch (error) {
      console.error('再エネ賦課金データ取得エラー:', error);
      throw error;
    }
  }

  // 再エネ賦課金データの登録
  async createRenewableSurcharge(data: Omit<RenewableSurchargeData, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const renewableData = {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      const docRef = await addDoc(collection(db, 'renewable_surcharge'), renewableData);
      return docRef.id;
    } catch (error) {
      console.error('再エネ賦課金データ保存エラー:', error);
      throw error;
    }
  }

  // インセンティブデータの取得
  async getIncentiveData(): Promise<IncentiveData[]> {
    try {
      const q = query(collection(db, 'incentive'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as any)
      })) as IncentiveData[];
    } catch (error) {
      console.error('インセンティブデータ取得エラー:', error);
      throw error;
    }
  }

  // インセンティブデータの登録
  async createIncentive(data: Omit<IncentiveData, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const incentiveData = {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      const docRef = await addDoc(collection(db, 'incentive'), incentiveData);
      return docRef.id;
    } catch (error) {
      console.error('インセンティブデータ保存エラー:', error);
      throw error;
    }
  }

  // インセンティブデータの更新
  async updateIncentive(id: string, data: Partial<IncentiveData>): Promise<void> {
    try {
      const ref = doc(db, 'incentive', id);
      await updateDoc(ref, {
        ...data,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('インセンティブデータ更新エラー:', error);
      throw error;
    }
  }

  // Jepxデータの取得（日付範囲指定）
  async getJepxData(startDate?: string, endDate?: string): Promise<JepxData[]> {
    try {
      let q;
      if (startDate && endDate) {
        q = query(
          collection(db, 'jepx_monthly_data'),
          where('date', '>=', startDate),
          where('date', '<=', endDate),
          orderBy('date', 'asc')
        );
      } else {
        q = query(collection(db, 'jepx_monthly_data'), orderBy('date', 'desc'));
      }
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as any)
      })) as JepxData[];
    } catch (error) {
      console.error('Jepxデータ取得エラー:', error);
      throw error;
    }
  }

  // Jepxデータの一括登録
  async createJepxDataBatch(jepxDataList: Omit<JepxData, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<void> {
    try {
      for (const daily of jepxDataList) {
        await setDoc(
          doc(collection(db, 'jepx_daily_data'), daily.date),
          {
            ...daily,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          }
        );
      }
    } catch (error) {
      console.error('Jepxデータ保存エラー:', error);
      throw error;
    }
  }

  // データタイプに基づく汎用データ取得
  async getDataByType(dataType: DataType, startDate?: string, endDate?: string): Promise<any[]> {
    switch (dataType) {
      case DataType.TRADE_NAME:
        return this.getTradeList();
      case DataType.FUEL_ADJUSTMENT:
        return this.getFuelAdjustmentData();
      case DataType.TAKUSO_PRICE:
        return this.getTakusoPriceData();
      case DataType.CAPACITY_CONTRIBUTION:
        return this.getCapacityContributionData();
      case DataType.SERVICE_CHARGE:
        return this.getServiceChargeData();
      case DataType.RENEWABLE_SURCHARGE:
        return this.getRenewableSurchargeData();
      case DataType.INCENTIVE:
        return this.getIncentiveData();
      case DataType.JEPX:
        return this.getJepxData(startDate, endDate);
      default:
        throw new Error(`未対応のデータタイプ: ${dataType}`);
    }
  }

  // データタイプに基づく汎用データ削除
  async deleteDataByType(dataType: DataType, id: string): Promise<void> {
    try {
      let collectionName: string;
      
      switch (dataType) {
        case DataType.TRADE_NAME:
          collectionName = 'trend';
          break;
        case DataType.FUEL_ADJUSTMENT:
          collectionName = 'fuel_adjustment';
          break;
        case DataType.TAKUSO_PRICE:
          collectionName = 'takuso_price';
          break;
        case DataType.CAPACITY_CONTRIBUTION:
          collectionName = 'yoryo_price';
          break;
        case DataType.SERVICE_CHARGE:
          collectionName = 'service_charge';
          break;
        case DataType.RENEWABLE_SURCHARGE:
          collectionName = 'renewable_surcharge';
          break;
        case DataType.INCENTIVE:
          collectionName = 'incentive';
          break;
        case DataType.JEPX:
          collectionName = 'jepx_daily_data';
          break;
        default:
          throw new Error(`未対応のデータタイプ: ${dataType}`);
      }
      
      const docRef = doc(db, collectionName, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('データ削除エラー:', error);
      throw error;
    }
  }
}

export const dataService = new DataService(); 