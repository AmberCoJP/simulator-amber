import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy, updateDoc, doc, setDoc, where, getDoc } from 'firebase/firestore';
import { db } from '../firebase/index.ts';
import { OPTION_LIST, CONTRACT_TYPE_LIST, REGION_LIST } from '../constants/index.ts';
import IconButton from '@mui/material/IconButton';
import EditIcon from '@mui/icons-material/Edit';
import PauseIcon from '@mui/icons-material/Pause';

const DataEntryContainer = styled.div`
  padding: 2rem;
  max-width: 1300px;
  margin: 0 auto;
`;

const Title = styled.h1`
  color: #333;
  margin-bottom: 2rem;
`;

const Form = styled.form`
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  color: #333;
  font-weight: 500;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
`;

const Select = styled.select`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
`;

const Button = styled.button`
  padding: 0.75rem 1.5rem;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  margin-right: 1rem;
  &:hover {
    background-color: #0056b3;
  }
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 8px;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  position: relative;
`;

const ModalTitle = styled.h2`
  color: #333;
  margin-bottom: 1.5rem;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
  &:hover {
    color: #333;
  }
`;

const FileInput = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
`;

const DataList = styled.div`
  margin-top: 2rem;
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const DataListTitle = styled.h2`
  color: #333;
  margin-bottom: 1.5rem;
`;

const DataTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
`;

const TableHeader = styled.th`
  background-color: #f8f9fa;
  padding: 0.75rem;
  text-align: left;
  border-bottom: 2px solid #dee2e6;
  font-weight: 600;
`;

const TableCell = styled.td`
  padding: 0.75rem;
  border-bottom: 1px solid #dee2e6;
`;

const TableRow = styled.tr`
  &:hover {
    background-color: #f8f9fa;
  }
`;

const NoDataMessage = styled.div`
  text-align: center;
  padding: 2rem;
  color: #666;
  font-style: italic;
`;

const DataEntry: React.FC = () => {
  const [formData, setFormData] = useState({
    buildingType: '',
  });

  const [modalData, setModalData] = useState({
    tradeName: '',
    registrationDate: '',
    iconImage: null as File | null,
    // 燃料調整費用のフィールド
    flow: '',
    region: '',
    contract: '',
    areaLossRate: '',
    startDate: '',
    // 託送料金用のフィールド
    basicPrice: '',
    basicPriceFirst6kw: '',
    basicPriceOver6kw: '',
    basicPriceType: 'per_kw', // 'per_kw' または 'tiered'
    volumePrice: '',
    // 容量拠出金用のフィールド
    price: '',
    // サービス料用のフィールド
    servicePrice: '',
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [registeredData, setRegisteredData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [tradeList, setTradeList] = useState<any[]>([]);
  const [tradeNameMap, setTradeNameMap] = useState<{[key: string]: string}>({});

  // 商流IDから商流名を取得する関数
  const getTradeNameById = (tradeId: string) => {
    return tradeNameMap[tradeId] || '不明な商流';
  };

  // 地域IDから地域名を取得する関数
  const getRegionNameById = (regionId: string) => {
    const region = REGION_LIST.find(r => r.value === regionId);
    return region ? region.label : regionId;
  };

  // 登録済みデータを取得
  const fetchRegisteredData = async () => {
    setIsLoading(true);
    try {
      const q = query(collection(db, 'trend'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRegisteredData(data);
    } catch (error) {
      console.error('データ取得エラー:', error);
      alert('データの取得に失敗しました。');
    } finally {
      setIsLoading(false);
    }
  };

  // Jepxデータ用: 日付範囲で取得
  const fetchJepxData = async () => {
    if (!startDate || !endDate) {
      // 日付が指定されていない場合は全データを取得
      setIsLoading(true);
      try {
        const q = query(collection(db, 'jepx_monthly_data'), orderBy('date', 'desc'));
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setRegisteredData(data);
      } catch (error) {
        alert('Jepxデータの取得に失敗しました');
      } finally {
        setIsLoading(false);
      }
      return;
    }
    setIsLoading(true);
    try {
      const q = query(
        collection(db, 'jepx_monthly_data'),
        where('date', '>=', startDate),
        where('date', '<=', endDate),
        orderBy('date', 'asc')
      );
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRegisteredData(data);
    } catch (error) {
      alert('Jepxデータの取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  // 燃料調整費データ用: データ取得
  const fetchFuelAdjustmentData = async () => {
    setIsLoading(true);
    try {
      const q = query(collection(db, 'fuel_adjustment'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRegisteredData(data);
    } catch (error) {
      console.error('燃料調整費データ取得エラー:', error);
      alert('燃料調整費データの取得に失敗しました。');
    } finally {
      setIsLoading(false);
    }
  };

  // 託送料金データ用: データ取得
  const fetchTakusoPriceData = async () => {
    setIsLoading(true);
    try {
      const q = query(collection(db, 'takuso_price'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRegisteredData(data);
    } catch (error) {
      console.error('託送料金データ取得エラー:', error);
      alert('託送料金データの取得に失敗しました。');
    } finally {
      setIsLoading(false);
    }
  };

  // 容量拠出金データ用: データ取得
  const fetchYoryoPriceData = async () => {
    setIsLoading(true);
    try {
      const q = query(collection(db, 'yoryo_price'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRegisteredData(data);
    } catch (error) {
      console.error('容量拠出金データ取得エラー:', error);
      alert('容量拠出金データの取得に失敗しました。');
    } finally {
      setIsLoading(false);
    }
  };

  // サービス料データ用: データ取得
  const fetchServiceChargeData = async () => {
    setIsLoading(true);
    try {
      const q = query(collection(db, 'service_charge'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRegisteredData(data);
    } catch (error) {
      console.error('サービス料データ取得エラー:', error);
      alert('サービス料データの取得に失敗しました。');
    } finally {
      setIsLoading(false);
    }
  };

  // 再エネ賦課金データ用: データ取得
  const fetchRenewableSurchargeData = async () => {
    setIsLoading(true);
    try {
      const q = query(collection(db, 'renewable_surcharge'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRegisteredData(data);
    } catch (error) {
      console.error('再エネ賦課金データ取得エラー:', error);
      alert('再エネ賦課金データの取得に失敗しました。');
    } finally {
      setIsLoading(false);
    }
  };

  // 商流一覧を取得
  const fetchTradeList = async () => {
    try {
      const q = query(collection(db, 'trend'), orderBy('tradeName', 'asc'));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];
      setTradeList(data);
      
      // IDと商流名のマッピングを作成
      const nameMap: {[key: string]: string} = {};
      data.forEach(trade => {
        nameMap[trade.tradeId || trade.id] = trade.tradeName;
      });
      setTradeNameMap(nameMap);
    } catch (error) {
      console.error('商流一覧取得エラー:', error);
    }
  };

  // コンポーネントマウント時にデータを取得
  useEffect(() => {
    fetchRegisteredData();
    fetchTradeList();
  }, []);

  // データ名が変更された時にデータを再取得
  useEffect(() => {
    if (formData.buildingType) {
      if (isJepxDataSelected) {
        fetchJepxData();
      } else if (isFuelAdjustment) {
        fetchFuelAdjustmentData();
      } else if (isTakusoPrice) {
        fetchTakusoPriceData();
      } else if (isYoryoPrice) {
        fetchYoryoPriceData();
      } else if (isServiceCharge) {
        fetchServiceChargeData();
      } else if (isRenewableSurcharge) {
        fetchRenewableSurchargeData();
      } else {
        fetchRegisteredData();
      }
    }
  }, [formData.buildingType, startDate, endDate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleModalChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'iconImage' && e.target instanceof HTMLInputElement && e.target.files) {
      setModalData(prev => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).files![0]
      }));
    } else if (name === 'csvFile' && e.target instanceof HTMLInputElement && e.target.files) {
      handleCsvFileUpload((e.target as HTMLInputElement).files![0]);
    } else {
      setModalData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // CSVファイル読み込み処理
  const handleCsvFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(header => header.trim());
      const data = lines.slice(1).filter(line => line.trim()).map(line => {
        const values = line.split(',').map(value => value.trim());
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        return row;
      });

      // 日付ごとにグループ化
      const grouped: { [date: string]: any[] } = {};
      data.forEach(row => {
        const date = row['受渡日'];
        if (!grouped[date]) grouped[date] = [];
        grouped[date].push(row);
      });

      // 日ごとに集計
      const areaKeys = [
        { key: 'エリアプライス北海道(円/kWh)', name: 'hokkaido' },
        { key: 'エリアプライス東北(円/kWh)', name: 'tohoku' },
        { key: 'エリアプライス東京(円/kWh)', name: 'tokyo' },
        { key: 'エリアプライス中部(円/kWh)', name: 'chubu' },
        { key: 'エリアプライス北陸(円/kWh)', name: 'hokuriku' },
        { key: 'エリアプライス関西(円/kWh)', name: 'kansai' },
        { key: 'エリアプライス中国(円/kWh)', name: 'chugoku' },
        { key: 'エリアプライス四国(円/kWh)', name: 'shikoku' },
        { key: 'エリアプライス九州(円/kWh)', name: 'kyushu' }
      ];

      const dailyData = Object.entries(grouped).map(([date, rows]) => {
        // システムプライスの平均
        const systemAverage =
          rows.reduce((sum, row) => sum + parseFloat(row['システムプライス(円/kWh)'] || '0'), 0) / rows.length;

        // 各エリアの平均
        const areaAverages: any = {};
        areaKeys.forEach(area => {
          areaAverages[area.name] =
            rows.reduce((sum, row) => sum + parseFloat(row[area.key] || '0'), 0) / rows.length;
        });

        return {
          date: date.replace(/\//g, '-'),
          systemAverage: Number(systemAverage.toFixed(2)),
          areaAverages: Object.fromEntries(
            Object.entries(areaAverages).map(([k, v]) => [k, Number((v as number).toFixed(2))])
          )
        };
      });

      setCsvData(dailyData);
      console.log('日毎のJepxデータ:', dailyData);
    };
    reader.readAsText(file, 'Shift_JIS');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isBusinessFlowSelected) {
      try {
        if (editId) {
          // 編集時はupdateDoc - 既存のドキュメントIDを使用
          const ref = doc(db, 'trend', editId);
          await updateDoc(ref, {
            tradeName: modalData.tradeName,
            registrationDate: modalData.registrationDate || new Date().toISOString().split('T')[0],
            iconImage: modalData.iconImage ? modalData.iconImage.name : null,
            updatedAt: serverTimestamp(),
          });
          alert('データを更新しました');
        } else {
          // 新規登録 - 自動生成IDを使用し、そのIDを商流IDとして保存
          const trendData = {
            tradeId: '', // 後で設定
            tradeName: modalData.tradeName,
            registrationDate: modalData.registrationDate || new Date().toISOString().split('T')[0],
            iconImage: modalData.iconImage ? modalData.iconImage.name : null,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          };
          const docRef = await addDoc(collection(db, 'trend'), trendData);
          
          // 生成されたIDを商流IDとして更新
          await updateDoc(docRef, {
            tradeId: docRef.id
          });
          
          alert('商流一覧データが正常に登録されました。');
        }
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
        });
        setIsModalOpen(false);
        setEditId(null);
        fetchRegisteredData();
      } catch (error: any) {
        console.error('データ保存エラー詳細:', error);
        console.error('エラーコード:', error.code);
        console.error('エラーメッセージ:', error.message);
        console.error('エラー詳細:', error.details);
        
        let errorMessage = 'データの保存に失敗しました。';
        if (error.code === 'permission-denied') {
          errorMessage = '権限が不足しています。Firebaseコンソールでセキュリティルールを確認してください。';
        } else if (error.code === 'unavailable') {
          errorMessage = 'Firebaseサービスが利用できません。ネットワーク接続を確認してください。';
        } else if (error.code === 'unauthenticated') {
          errorMessage = '認証が必要です。ログインしてください。';
        }
        
        alert(errorMessage);
      }
    } else if (isJepxDataSelected) {
      // Jepxデータの場合の処理（日毎に保存）
      if (csvData.length === 0) {
        alert('CSVファイルを選択してください。');
        return;
      }
      try {
        // Firestoreに日毎で保存
        for (const daily of csvData) {
          await setDoc(
            doc(collection(db, 'jepx_daily_data'), daily.date),
            {
              ...daily,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            }
          );
        }
        alert('Jepxデータ（日毎）が正常に登録されました。');
        setFormData({
          buildingType: '',
        });
        setCsvData([]);
        fetchRegisteredData();
      } catch (error: any) {
        console.error('Jepxデータ保存エラー:', error);
        alert('Jepxデータの保存に失敗しました。');
      }
    } else if (isFuelAdjustment) {
      // 燃料調整費データの処理
      try {
        if (editId) {
          // 編集時はupdateDoc
          const ref = doc(db, 'fuel_adjustment', editId);
          await updateDoc(ref, {
            tradeId: modalData.flow, // 商流IDのみ保存
            region: modalData.region,
            contract: modalData.contract,
            areaLossRate: parseFloat(modalData.areaLossRate),
            startDate: modalData.startDate,
            updatedAt: serverTimestamp(),
          });
          alert('燃料調整費データを更新しました');
        } else {
          // 新規登録
          const fuelAdjustmentData = {
            tradeId: modalData.flow, // 商流IDのみ保存
            region: modalData.region,
            contract: modalData.contract,
            areaLossRate: parseFloat(modalData.areaLossRate),
            startDate: modalData.startDate,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          };
          await addDoc(collection(db, 'fuel_adjustment'), fuelAdjustmentData);
          alert('燃料調整費データが正常に登録されました。');
        }
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
        });
        setIsModalOpen(false);
        setEditId(null);
        fetchRegisteredData();
      } catch (error: any) {
        console.error('燃料調整費データ保存エラー:', error);
        alert('燃料調整費データの保存に失敗しました。');
      }
    } else if (isTakusoPrice) {
      // 託送料金データの処理
      try {
        if (editId) {
          // 編集時はupdateDoc
          const ref = doc(db, 'takuso_price', editId);
          await updateDoc(ref, {
            tradeId: modalData.flow, // 商流IDのみ保存
            region: modalData.region,
            contract: modalData.contract,
            basicPrice: modalData.basicPriceType === 'per_kw' ? parseFloat(modalData.basicPrice) : '',
            basicPriceFirst6kw: modalData.basicPriceType === 'tiered' ? parseFloat(modalData.basicPriceFirst6kw) : '',
            basicPriceOver6kw: modalData.basicPriceType === 'tiered' ? parseFloat(modalData.basicPriceOver6kw) : '',
            basicPriceType: modalData.basicPriceType,
            volumePrice: parseFloat(modalData.volumePrice),
            startDate: modalData.startDate,
            updatedAt: serverTimestamp(),
          });
          alert('託送料金データを更新しました');
        } else {
          // 新規登録
          const takusoPriceData = {
            tradeId: modalData.flow, // 商流IDのみ保存
            region: modalData.region,
            contract: modalData.contract,
            basicPrice: modalData.basicPriceType === 'per_kw' ? parseFloat(modalData.basicPrice) : '',
            basicPriceFirst6kw: modalData.basicPriceType === 'tiered' ? parseFloat(modalData.basicPriceFirst6kw) : '',
            basicPriceOver6kw: modalData.basicPriceType === 'tiered' ? parseFloat(modalData.basicPriceOver6kw) : '',
            basicPriceType: modalData.basicPriceType,
            volumePrice: parseFloat(modalData.volumePrice),
            startDate: modalData.startDate,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          };
          await addDoc(collection(db, 'takuso_price'), takusoPriceData);
          alert('託送料金データが正常に登録されました。');
        }
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
        });
        setIsModalOpen(false);
        setEditId(null);
        fetchRegisteredData();
      } catch (error: any) {
        console.error('託送料金データ保存エラー:', error);
        alert('託送料金データの保存に失敗しました。');
      }
    } else if (isYoryoPrice) {
      // 容量拠出金データの処理
      try {
        if (editId) {
          // 編集時はupdateDoc
          const ref = doc(db, 'yoryo_price', editId);
          await updateDoc(ref, {
            tradeId: modalData.flow, // 商流IDのみ保存
            region: modalData.region,
            contract: modalData.contract,
            price: parseFloat(modalData.price),
            startDate: modalData.startDate,
            updatedAt: serverTimestamp(),
          });
          alert('容量拠出金データを更新しました');
        } else {
          // 新規登録
          const yoryoPriceData = {
            tradeId: modalData.flow, // 商流IDのみ保存
            region: modalData.region,
            contract: modalData.contract,
            price: parseFloat(modalData.price),
            startDate: modalData.startDate,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          };
          await addDoc(collection(db, 'yoryo_price'), yoryoPriceData);
          alert('容量拠出金データが正常に登録されました。');
        }
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
        });
        setIsModalOpen(false);
        setEditId(null);
        fetchRegisteredData();
      } catch (error: any) {
        console.error('容量拠出金データ保存エラー:', error);
        alert('容量拠出金データの保存に失敗しました。');
      }
    } else if (isServiceCharge) {
      // サービス料データの処理
      try {
        if (editId) {
          // 編集時はupdateDoc
          const ref = doc(db, 'service_charge', editId);
          await updateDoc(ref, {
            price: parseFloat(modalData.servicePrice),
            startDate: modalData.startDate,
            updatedAt: serverTimestamp(),
          });
          alert('サービス料データを更新しました');
        } else {
          // 新規登録
          const serviceChargeData = {
            price: parseFloat(modalData.servicePrice),
            startDate: modalData.startDate,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          };
          await addDoc(collection(db, 'service_charge'), serviceChargeData);
          alert('サービス料データが正常に登録されました。');
        }
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
        });
        setIsModalOpen(false);
        setEditId(null);
        fetchRegisteredData();
      } catch (error: any) {
        console.error('サービス料データ保存エラー:', error);
        alert('サービス料データの保存に失敗しました。');
      }
    } else if (isRenewableSurcharge) {
      // 再エネ賦課金データの処理
      try {
        if (editId) {
          // 編集時はupdateDoc
          const ref = doc(db, 'renewable_surcharge', editId);
          await updateDoc(ref, {
            price: parseFloat(modalData.servicePrice),
            startDate: modalData.startDate,
            updatedAt: serverTimestamp(),
          });
          alert('再エネ賦課金データを更新しました');
        } else {
          // 新規登録
          const renewableSurchargeData = {
            price: parseFloat(modalData.servicePrice),
            startDate: modalData.startDate,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          };
          await addDoc(collection(db, 'renewable_surcharge'), renewableSurchargeData);
          alert('再エネ賦課金データが正常に登録されました。');
        }
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
        });
        setIsModalOpen(false);
        setEditId(null);
        fetchRegisteredData();
      } catch (error: any) {
        console.error('再エネ賦課金データ保存エラー:', error);
        alert('再エネ賦課金データの保存に失敗しました。');
      }
    } else {
      // TODO: 通常のデータ登録処理の実装
      console.log('登録データ:', formData);
    }
  };

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  // 商流一覧が選択されているかどうかをチェック
  const isBusinessFlowSelected = formData.buildingType === 'trade_name';
  
  // Jepxデータが選択されているかどうかをチェック
  const isJepxDataSelected = formData.buildingType === 'jepx';

  // 燃料調整費が選択されているかどうかをチェック
  const isFuelAdjustment = formData.buildingType === 'fuel_adjustment';

  // 託送料金が選択されているかどうかをチェック
  const isTakusoPrice = formData.buildingType === 'takuso_price';

  // 容量拠出金が選択されているかどうかをチェック
  const isYoryoPrice = formData.buildingType === 'capacity_contribution';

  // サービス料が選択されているかどうかをチェック
  const isServiceCharge = formData.buildingType === 'service_charge';

  // 再エネ賦課金が選択されているかどうかをチェック
  const isRenewableSurcharge = formData.buildingType === 'renewable_surcharge';

  // 日付をフォーマットする関数
  const formatDate = (timestamp: any) => {
    if (!timestamp) return '-';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('ja-JP');
  };

  // 編集ボタンの処理
  const handleEdit = (data: any) => {
    setModalData({
      tradeName: data.tradeName || '',
      registrationDate: data.registrationDate || '',
      iconImage: null,
      flow: data.tradeId || '', // 商流IDを設定
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
    });
    setEditId(data.id);
    setIsModalOpen(true);
  };

  // 停止ボタンの処理
  const handlePause = (data: any) => {
    alert(`${data.tradeName} を停止します`);
  };

  return (
    <DataEntryContainer>
      <Title>電気使用データ登録</Title>
      <Form onSubmit={handleSubmit}>
        <FormGroup>
          <Label>データ名</Label>
          <Select
            name="buildingType"
            value={formData.buildingType}
            onChange={handleChange}
            required
          >
            <option value="">選択してください</option>
            {OPTION_LIST.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </FormGroup>

        <div>
          <Button type="button" onClick={openModal}>データ登録</Button>
        </div>
      </Form>

      {/* 登録済みデータ一覧 */}
      <DataList>
        <DataListTitle>
          {isJepxDataSelected ? 'Jepx日毎データ一覧' : 
           isFuelAdjustment ? '燃料調整費データ一覧' : 
           isTakusoPrice ? '託送料金データ一覧' :
           isYoryoPrice ? '容量拠出金データ一覧' :
           isServiceCharge ? 'サービス料データ一覧' :
           isRenewableSurcharge ? '再エネ賦課金データ一覧' :
           '登録済みデータ一覧'}
        </DataListTitle>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>読み込み中...</div>
        ) : registeredData.length > 0 ? (
          <DataTable>
            <thead>
              <tr>
                {isJepxDataSelected ? (
                  <>
                    <TableHeader>日付</TableHeader>
                    <TableHeader>北海道</TableHeader>
                    <TableHeader>東北</TableHeader>
                    <TableHeader>東京</TableHeader>
                    <TableHeader>中部</TableHeader>
                    <TableHeader>北陸</TableHeader>
                    <TableHeader>関西</TableHeader>
                    <TableHeader>中国</TableHeader>
                    <TableHeader>四国</TableHeader>
                    <TableHeader>九州</TableHeader>
                  </>
                ) : isFuelAdjustment ? (
                  <>
                    <TableHeader>商流</TableHeader>
                    <TableHeader>地域</TableHeader>
                    <TableHeader>契約</TableHeader>
                    <TableHeader>係数</TableHeader>
                    <TableHeader>適用開始日</TableHeader>
                    <TableHeader>作成日時</TableHeader>
                    <TableHeader>操作</TableHeader>
                  </>
                ) : isTakusoPrice ? (
                  <>
                    <TableHeader>商流</TableHeader>
                    <TableHeader>地域</TableHeader>
                    <TableHeader>契約</TableHeader>
                    <TableHeader>託送基本料金</TableHeader>
                    <TableHeader>託送従量料金</TableHeader>
                    <TableHeader>適用開始日</TableHeader>
                    <TableHeader>作成日時</TableHeader>
                    <TableHeader>操作</TableHeader>
                  </>
                ) : isYoryoPrice ? (
                  <>
                    <TableHeader>商流</TableHeader>
                    <TableHeader>地域</TableHeader>
                    <TableHeader>契約</TableHeader>
                    <TableHeader>容量拠出金</TableHeader>
                    <TableHeader>適用開始日</TableHeader>
                    <TableHeader>作成日時</TableHeader>
                    <TableHeader>操作</TableHeader>
                  </>
                ) : isServiceCharge ? (
                  <>
                    <TableHeader>料金</TableHeader>
                    <TableHeader>適用開始日</TableHeader>
                    <TableHeader>作成日時</TableHeader>
                    <TableHeader>操作</TableHeader>
                  </>
                ) : isRenewableSurcharge ? (
                  <>
                    <TableHeader>料金</TableHeader>
                    <TableHeader>適用開始日</TableHeader>
                    <TableHeader>作成日時</TableHeader>
                    <TableHeader>操作</TableHeader>
                  </>
                ) : (
                  <>
                    <TableHeader>商流名</TableHeader>
                    <TableHeader>登録日</TableHeader>
                    <TableHeader>アイコン画像</TableHeader>
                    <TableHeader>作成日時</TableHeader>
                    <TableHeader>操作</TableHeader>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {registeredData.map((data) => (
                isJepxDataSelected ? (
                  <TableRow key={data.id}>
                    <TableCell>{data.date || '-'}</TableCell>
                    <TableCell>{data.areaAverages?.hokkaido ?? '-'}</TableCell>
                    <TableCell>{data.areaAverages?.tohoku ?? '-'}</TableCell>
                    <TableCell>{data.areaAverages?.tokyo ?? '-'}</TableCell>
                    <TableCell>{data.areaAverages?.chubu ?? '-'}</TableCell>
                    <TableCell>{data.areaAverages?.hokuriku ?? '-'}</TableCell>
                    <TableCell>{data.areaAverages?.kansai ?? '-'}</TableCell>
                    <TableCell>{data.areaAverages?.chugoku ?? '-'}</TableCell>
                    <TableCell>{data.areaAverages?.shikoku ?? '-'}</TableCell>
                    <TableCell>{data.areaAverages?.kyushu ?? '-'}</TableCell>
                  </TableRow>
                ) : isFuelAdjustment ? (
                  <TableRow key={data.id}>
                    <TableCell>{getTradeNameById(data.tradeId) || '-'}</TableCell>
                    <TableCell>{getRegionNameById(data.region) || '-'}</TableCell>
                    <TableCell>{data.contract || '-'}</TableCell>
                    <TableCell>{data.areaLossRate || '-'}</TableCell>
                    <TableCell>{data.startDate || '-'}</TableCell>
                    <TableCell>{formatDate(data.createdAt)}</TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleEdit(data)} size="small">
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => handlePause(data)} size="small">
                        <PauseIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ) : isTakusoPrice ? (
                  <TableRow key={data.id}>
                    <TableCell>{getTradeNameById(data.tradeId) || '-'}</TableCell>
                    <TableCell>{getRegionNameById(data.region) || '-'}</TableCell>
                    <TableCell>{data.contract || '-'}</TableCell>
                    <TableCell>
                      {data.basicPriceType === 'per_kw' 
                        ? `${data.basicPrice}円/kW` 
                        : `${data.basicPriceFirst6kw}円（6kWまで）/ ${data.basicPriceOver6kw}円/kW（6kW～）`}
                    </TableCell>
                    <TableCell>{data.volumePrice ? `${data.volumePrice}円/kWh` : '-'}</TableCell>
                    <TableCell>{data.startDate || '-'}</TableCell>
                    <TableCell>{formatDate(data.createdAt)}</TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleEdit(data)} size="small">
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => handlePause(data)} size="small">
                        <PauseIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ) : isYoryoPrice ? (
                  <TableRow key={data.id}>
                    <TableCell>{getTradeNameById(data.tradeId) || '-'}</TableCell>
                    <TableCell>{getRegionNameById(data.region) || '-'}</TableCell>
                    <TableCell>{data.contract || '-'}</TableCell>
                    <TableCell>{data.price ? `${data.price}円/kW` : '-'}</TableCell>
                    <TableCell>{data.startDate || '-'}</TableCell>
                    <TableCell>{formatDate(data.createdAt)}</TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleEdit(data)} size="small">
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => handlePause(data)} size="small">
                        <PauseIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ) : isServiceCharge ? (
                  <TableRow key={data.id}>
                    <TableCell>{data.price ? `${data.price}円/kWh` : '-'}</TableCell>
                    <TableCell>{data.startDate || '-'}</TableCell>
                    <TableCell>{formatDate(data.createdAt)}</TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleEdit(data)} size="small">
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => handlePause(data)} size="small">
                        <PauseIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ) : isRenewableSurcharge ? (
                  <TableRow key={data.id}>
                    <TableCell>{data.price ? `${data.price}円/kWh` : '-'}</TableCell>
                    <TableCell>{data.startDate || '-'}</TableCell>
                    <TableCell>{formatDate(data.createdAt)}</TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleEdit(data)} size="small">
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => handlePause(data)} size="small">
                        <PauseIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ) : (
                  <TableRow key={data.id}>
                    <TableCell>{data.tradeName || '-'}</TableCell>
                    <TableCell>{data.registrationDate || '-'}</TableCell>
                    <TableCell>{data.iconImage || '-'}</TableCell>
                    <TableCell>{formatDate(data.createdAt)}</TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleEdit(data)} size="small">
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => handlePause(data)} size="small">
                        <PauseIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                )
              ))}
            </tbody>
          </DataTable>
        ) : (
          <NoDataMessage>登録済みのデータがありません。</NoDataMessage>
        )}
      </DataList>

      {isModalOpen && (
        <Modal>
          <ModalContent>
            <CloseButton onClick={closeModal}>&times;</CloseButton>
            <ModalTitle>
              {isBusinessFlowSelected ? '商流一覧データ登録' : 
               isJepxDataSelected ? 'Jepxデータ登録' : 
               isFuelAdjustment ? '燃料調整費データ登録' :
               isTakusoPrice ? '託送料金データ登録' :
               isYoryoPrice ? '容量拠出金データ登録' :
               isServiceCharge ? 'サービス料データ登録' :
               isRenewableSurcharge ? '再エネ賦課金データ登録' :
               'データ登録'}
            </ModalTitle>
            <Form onSubmit={handleSubmit}>
              {isBusinessFlowSelected ? (
                <>
                  <FormGroup>
                    <Label>商流名 *</Label>
                    <Input
                      type="text"
                      name="tradeName"
                      value={modalData.tradeName}
                      onChange={handleModalChange}
                      required
                    />
                  </FormGroup>
                  <FormGroup>
                    <Label>登録日</Label>
                    <Input
                      type="date"
                      name="registrationDate"
                      value={modalData.registrationDate}
                      onChange={handleModalChange}
                    />
                  </FormGroup>
                  <FormGroup>
                    <Label>アイコン画像</Label>
                    <FileInput
                      type="file"
                      name="iconImage"
                      accept="image/*"
                      onChange={handleModalChange}
                    />
                  </FormGroup>
                </>
              ) : isJepxDataSelected ? (
                <>
                  <FormGroup>
                    <Label>CSVファイル *</Label>
                    <FileInput
                      type="file"
                      name="csvFile"
                      accept=".csv"
                      onChange={handleModalChange}
                      required
                    />
                  </FormGroup>
                  {csvData.length > 0 && (
                    <FormGroup>
                      <Label>読み込まれたデータ数: {csvData.length}件</Label>
                    </FormGroup>
                  )}
                </>
              ) : isFuelAdjustment ? (
                <>
                  <FormGroup>
                    <Label>商流 *</Label>
                    <Select
                      name="flow"
                      value={modalData.flow}
                      onChange={handleModalChange}
                      required
                    >
                      <option value="">選択してください</option>
                      {tradeList.map(trade => (
                        <option key={trade.id} value={trade.tradeId || trade.id}>
                          {trade.tradeName}
                        </option>
                      ))}
                    </Select>
                  </FormGroup>
                  <FormGroup>
                    <Label>地域 *</Label>
                    <Select
                      name="region"
                      value={modalData.region}
                      onChange={handleModalChange}
                      required
                    >
                      <option value="">選択してください</option>
                      {REGION_LIST.map(region => (
                        <option key={region.value} value={region.value}>
                          {region.label}
                        </option>
                      ))}
                    </Select>
                  </FormGroup>
                  <FormGroup>
                    <Label>契約 *</Label>
                    <Select
                      name="contract"
                      value={modalData.contract}
                      onChange={handleModalChange}
                      required
                    >
                      <option value="">選択してください</option>
                      {CONTRACT_TYPE_LIST.map(contract => (
                        <option key={contract.value} value={contract.value}>
                          {contract.label}
                        </option>
                      ))}
                    </Select>
                  </FormGroup>
                  <FormGroup>
                    <Label>係数 *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      name="areaLossRate"
                      value={modalData.areaLossRate}
                      onChange={handleModalChange}
                      required
                    />
                  </FormGroup>
                  <FormGroup>
                    <Label>適用開始日 *</Label>
                    <Input
                      type="date"
                      name="startDate"
                      value={modalData.startDate}
                      onChange={handleModalChange}
                      required
                    />
                  </FormGroup>
                </>
              ) : isTakusoPrice ? (
                <>
                  <FormGroup>
                    <Label>商流 *</Label>
                    <Select
                      name="flow"
                      value={modalData.flow}
                      onChange={handleModalChange}
                      required
                    >
                      <option value="">選択してください</option>
                      {tradeList.map(trade => (
                        <option key={trade.id} value={trade.tradeId || trade.id}>
                          {trade.tradeName}
                        </option>
                      ))}
                    </Select>
                  </FormGroup>
                  <FormGroup>
                    <Label>地域 *</Label>
                    <Select
                      name="region"
                      value={modalData.region}
                      onChange={handleModalChange}
                      required
                    >
                      <option value="">選択してください</option>
                      {REGION_LIST.map(region => (
                        <option key={region.value} value={region.value}>
                          {region.label}
                        </option>
                      ))}
                    </Select>
                  </FormGroup>
                  <FormGroup>
                    <Label>契約 *</Label>
                    <Select
                      name="contract"
                      value={modalData.contract}
                      onChange={handleModalChange}
                      required
                    >
                      <option value="">選択してください</option>
                      {CONTRACT_TYPE_LIST.map(contract => (
                        <option key={contract.value} value={contract.value}>
                          {contract.label}
                        </option>
                      ))}
                    </Select>
                  </FormGroup>
                  <FormGroup>
                    <Label>託送基本料金の設定方法 *</Label>
                    <Select
                      name="basicPriceType"
                      value={modalData.basicPriceType}
                      onChange={handleModalChange}
                      required
                    >
                      <option value="per_kw">1kW毎の単価</option>
                      <option value="tiered">6kWまでの料金/6kW～単価</option>
                    </Select>
                  </FormGroup>
                  {modalData.basicPriceType === 'per_kw' ? (
                    <FormGroup>
                      <Label>託送基本料金（円/kW） *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        name="basicPrice"
                        value={modalData.basicPrice}
                        onChange={handleModalChange}
                        required
                      />
                    </FormGroup>
                  ) : (
                    <>
                      <FormGroup>
                        <Label>6kWまでの料金（円） *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          name="basicPriceFirst6kw"
                          value={modalData.basicPriceFirst6kw}
                          onChange={handleModalChange}
                          required
                        />
                      </FormGroup>
                      <FormGroup>
                        <Label>6kW～の単価（円/kW） *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          name="basicPriceOver6kw"
                          value={modalData.basicPriceOver6kw}
                          onChange={handleModalChange}
                          required
                        />
                      </FormGroup>
                    </>
                  )}
                  <FormGroup>
                    <Label>託送従量料金（円/kWh） *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      name="volumePrice"
                      value={modalData.volumePrice}
                      onChange={handleModalChange}
                      required
                    />
                  </FormGroup>
                  <FormGroup>
                    <Label>適用開始日 *</Label>
                    <Input
                      type="date"
                      name="startDate"
                      value={modalData.startDate}
                      onChange={handleModalChange}
                      required
                    />
                  </FormGroup>
                </>
              ) : isYoryoPrice ? (
                <>
                  <FormGroup>
                    <Label>商流 *</Label>
                    <Select
                      name="flow"
                      value={modalData.flow}
                      onChange={handleModalChange}
                      required
                    >
                      <option value="">選択してください</option>
                      {tradeList.map(trade => (
                        <option key={trade.id} value={trade.tradeId || trade.id}>
                          {trade.tradeName}
                        </option>
                      ))}
                    </Select>
                  </FormGroup>
                  <FormGroup>
                    <Label>地域 *</Label>
                    <Select
                      name="region"
                      value={modalData.region}
                      onChange={handleModalChange}
                      required
                    >
                      <option value="">選択してください</option>
                      {REGION_LIST.map(region => (
                        <option key={region.value} value={region.value}>
                          {region.label}
                        </option>
                      ))}
                    </Select>
                  </FormGroup>
                  <FormGroup>
                    <Label>契約 *</Label>
                    <Select
                      name="contract"
                      value={modalData.contract}
                      onChange={handleModalChange}
                      required
                    >
                      <option value="">選択してください</option>
                      {CONTRACT_TYPE_LIST.map(contract => (
                        <option key={contract.value} value={contract.value}>
                          {contract.label}
                        </option>
                      ))}
                    </Select>
                  </FormGroup>
                  <FormGroup>
                    <Label>容量拠出金（円/kW） *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      name="price"
                      value={modalData.price}
                      onChange={handleModalChange}
                      required
                    />
                  </FormGroup>
                  <FormGroup>
                    <Label>適用開始日 *</Label>
                    <Input
                      type="date"
                      name="startDate"
                      value={modalData.startDate}
                      onChange={handleModalChange}
                      required
                    />
                  </FormGroup>
                </>
              ) : isServiceCharge ? (
                <>
                  <FormGroup>
                    <Label>料金（円/kWh） *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      name="servicePrice"
                      value={modalData.servicePrice}
                      onChange={handleModalChange}
                      required
                    />
                  </FormGroup>
                  <FormGroup>
                    <Label>適用開始日 *</Label>
                    <Input
                      type="date"
                      name="startDate"
                      value={modalData.startDate}
                      onChange={handleModalChange}
                      required
                    />
                  </FormGroup>
                </>
              ) : isRenewableSurcharge ? (
                <>
                  <FormGroup>
                    <Label>料金（円/kWh） *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      name="servicePrice"
                      value={modalData.servicePrice}
                      onChange={handleModalChange}
                      required
                    />
                  </FormGroup>
                  <FormGroup>
                    <Label>適用開始日 *</Label>
                    <Input
                      type="date"
                      name="startDate"
                      value={modalData.startDate}
                      onChange={handleModalChange}
                      required
                    />
                  </FormGroup>
                </>
              ) : (
                <div>データ登録フォームがここに表示されます</div>
              )}
              <div>
                <Button type="submit">登録</Button>
                <Button type="button" onClick={closeModal}>キャンセル</Button>
              </div>
            </Form>
          </ModalContent>
        </Modal>
      )}
    </DataEntryContainer>
  );
};

export default DataEntry;