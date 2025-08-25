import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { OPTION_LIST, CONTRACT_TYPE_LIST, REGION_LIST, MONTH_LIST, INCENTIVE_FEE_TABLE } from '../constants/index.ts';
import IconButton from '@mui/material/IconButton';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useDataManagement, useModalData } from '../hooks/useDataManagement.ts';
import { DataType } from '../types/index.ts';
import { validateDataByType, formatValidationErrors } from '../utils/validation.ts';

const DataEntryContainer = styled.div`
  padding: 2rem;
  max-width: 1580px;
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
  table-layout: fixed;
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

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // カスタムフックを使用
  const { modalData, updateModalData, resetModalData, setModalDataForEdit } = useModalData();
  
  // フォームデータからDataTypeを取得
  const getDataTypeFromFormData = useCallback((buildingType: string): DataType => {
    switch (buildingType) {
      case 'trade_name':
        return DataType.TRADE_NAME;
      case 'jepx':
        return DataType.JEPX;
      case 'fuel_adjustment':
        return DataType.FUEL_ADJUSTMENT;
      case 'takuso_price':
        return DataType.TAKUSO_PRICE;
      case 'capacity_contribution':
        return DataType.CAPACITY_CONTRIBUTION;
      case 'service_charge':
        return DataType.SERVICE_CHARGE;
      case 'renewable_surcharge':
        return DataType.RENEWABLE_SURCHARGE;
      case 'incentive':
        return DataType.INCENTIVE;
      default:
        return DataType.TRADE_NAME;
    }
  }, []);

  // データ管理フック
  const { 
    data: registeredData, 
    isLoading, 
    error, 
    refreshData, 
    createData, 
    updateData,
    deleteData
  } = useDataManagement({ 
    dataType: getDataTypeFromFormData(formData.buildingType),
    startDate,
    endDate
  });

  // 商流一覧データ管理
  const { data: tradeList } = useDataManagement({ 
    dataType: DataType.TRADE_NAME 
  });



  // 商流IDから商流名を取得する関数
  const getTradeNameById = (tradeId: string) => {
    const trade = tradeList.find(t => t.tradeId === tradeId || t.id === tradeId);
    return trade ? trade.tradeName : '不明な商流';
  };

  // 地域IDから地域名を取得する関数
  const getRegionNameById = (regionId: string) => {
    const region = REGION_LIST.find(r => r.value === regionId);
    return region ? region.label : regionId;
  };

  // データ名が変更された時にデータを再取得
  useEffect(() => {
    if (formData.buildingType) {
      refreshData();
    }
  }, [formData.buildingType, startDate, endDate, refreshData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleModalChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    console.log('handleModalChange:', { name, value });
    
    if (name === 'iconImage' && e.target instanceof HTMLInputElement && e.target.files) {
      updateModalData(name, (e.target as HTMLInputElement).files![0]);
    } else if (name === 'csvFile' && e.target instanceof HTMLInputElement && e.target.files) {
      handleCsvFileUpload((e.target as HTMLInputElement).files![0]);
    } else if (name.startsWith('monthlyIndex_')) {
      // 月次指数の処理
      const month = name.replace('monthlyIndex_', '');
      const currentIndices = modalData.monthlyIndices || {};
      updateModalData('monthlyIndices', {
        ...currentIndices,
        [month]: value
      });
    } else if (name.startsWith('feeTable_')) {
      // 手数料テーブルの処理
      const [field, index] = name.replace('feeTable_', '').split('_');
      const currentFeeTable = modalData.feeTable || [];
      const updatedFeeTable = [...currentFeeTable];
      if (!updatedFeeTable[index]) {
        updatedFeeTable[index] = { kwhRange: '', minKwh: '', maxKwh: '', fee: '' };
      }
      updatedFeeTable[index] = {
        ...updatedFeeTable[index],
        [field]: value
      };
      updateModalData('feeTable', updatedFeeTable);
    } else {
      updateModalData(name as keyof typeof modalData, value);
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
    
    const dataType = getDataTypeFromFormData(formData.buildingType);
    
    try {
      if (isBusinessFlowSelected) {
        // 商流データの処理
        const tradeData = {
          tradeName: modalData.tradeName,
          registrationDate: modalData.registrationDate || new Date().toISOString().split('T')[0],
          iconImage: modalData.iconImage ? modalData.iconImage.name : null,
        };

        // バリデーション
        const validation = validateDataByType(DataType.TRADE_NAME, tradeData);
        if (!validation.isValid) {
          alert(formatValidationErrors(validation.errors));
          return;
        }

        if (editId) {
          await updateData(editId, tradeData);
          alert('データを更新しました');
        } else {
          await createData(tradeData);
          alert('商流一覧データが正常に登録されました。');
        }
      } else if (isJepxDataSelected) {
        // Jepxデータの場合の処理
        if (csvData.length === 0) {
          alert('CSVファイルを選択してください。');
          return;
        }
        await createData(csvData);
        alert('Jepxデータ（日毎）が正常に登録されました。');
        setFormData({ buildingType: '' });
        setCsvData([]);
      } else if (isFuelAdjustment) {
        // 燃料調整費データの処理
        const fuelData = {
          tradeId: modalData.flow,
          region: modalData.region,
          contract: modalData.contract,
          areaLossRate: parseFloat(modalData.areaLossRate),
          startDate: modalData.startDate,
        };

        // バリデーション
        const validation = validateDataByType(DataType.FUEL_ADJUSTMENT, fuelData);
        if (!validation.isValid) {
          alert(formatValidationErrors(validation.errors));
          return;
        }

        if (editId) {
          await updateData(editId, fuelData);
          alert('燃料調整費データを更新しました');
        } else {
          await createData(fuelData);
          alert('燃料調整費データが正常に登録されました。');
        }
      } else if (isTakusoPrice) {
        // 託送料金データの処理
        const takusoData = {
          tradeId: modalData.flow,
          region: modalData.region,
          contract: modalData.contract,
          basicPriceType: modalData.basicPriceType,
          basicPrice: modalData.basicPriceType === 'per_kw' ? parseFloat(modalData.basicPrice) : undefined,
          basicPriceFirst6kw: modalData.basicPriceType === 'tiered' ? parseFloat(modalData.basicPriceFirst6kw) : undefined,
          basicPriceOver6kw: modalData.basicPriceType === 'tiered' ? parseFloat(modalData.basicPriceOver6kw) : undefined,
          volumePrice: parseFloat(modalData.volumePrice),
          startDate: modalData.startDate,
        };

        // バリデーション
        const validation = validateDataByType(DataType.TAKUSO_PRICE, takusoData);
        if (!validation.isValid) {
          alert(formatValidationErrors(validation.errors));
          return;
        }

        if (editId) {
          await updateData(editId, takusoData);
          alert('託送料金データを更新しました');
        } else {
          await createData(takusoData);
          alert('託送料金データが正常に登録されました。');
        }
      } else if (isYoryoPrice) {
        // 容量拠出金データの処理
        const capacityData = {
          tradeId: modalData.flow,
          region: modalData.region,
          contract: modalData.contract,
          price: parseFloat(modalData.price),
          startDate: modalData.startDate,
        };

        // バリデーション
        const validation = validateDataByType(DataType.CAPACITY_CONTRIBUTION, capacityData);
        if (!validation.isValid) {
          alert(formatValidationErrors(validation.errors));
          return;
        }

        if (editId) {
          await updateData(editId, capacityData);
          alert('容量拠出金データを更新しました');
        } else {
          await createData(capacityData);
          alert('容量拠出金データが正常に登録されました。');
        }
      } else if (isServiceCharge) {
        // サービス料データの処理
        const serviceData = {
          price: parseFloat(modalData.servicePrice),
          startDate: modalData.startDate,
        };

        // バリデーション
        const validation = validateDataByType(DataType.SERVICE_CHARGE, serviceData);
        if (!validation.isValid) {
          alert(formatValidationErrors(validation.errors));
          return;
        }

        if (editId) {
          await updateData(editId, serviceData);
          alert('サービス料データを更新しました');
        } else {
          await createData(serviceData);
          alert('サービス料データが正常に登録されました。');
        }
      } else if (isRenewableSurcharge) {
        // 再エネ賦課金データの処理
        const renewableData = {
          price: parseFloat(modalData.servicePrice),
          startDate: modalData.startDate,
        };

        // バリデーション
        const validation = validateDataByType(DataType.RENEWABLE_SURCHARGE, renewableData);
        if (!validation.isValid) {
          alert(formatValidationErrors(validation.errors));
          return;
        }

        if (editId) {
          await updateData(editId, renewableData);
          alert('再エネ賦課金データを更新しました');
        } else {
          await createData(renewableData);
          alert('再エネ賦課金データが正常に登録されました。');
        }
      } else if (isIncentive) {
        // インセンティブデータの処理
        const incentiveData: any = {
          tradeId: modalData.flow,
          contract: modalData.contract,
          monthlyIndices: Object.fromEntries(
            Object.entries(modalData.monthlyIndices || {}).map(([month, value]) => [
              month,
              parseFloat(value as string)
            ])
          ),
          incentiveType: modalData.incentiveType,
          startDate: modalData.startDate,
        };

        // インセンティブタイプに応じてデータを設定
        if (modalData.incentiveType === 'feeTable') {
          incentiveData.feeTable = (modalData.feeTable || []).map(fee => ({
            kwhRange: fee.kwhRange,
            minKwh: parseFloat(fee.minKwh),
            maxKwh: fee.maxKwh ? parseFloat(fee.maxKwh) : Infinity,
            fee: parseFloat(fee.fee)
          }));
        } else if (modalData.incentiveType === 'flatRate') {
          console.log('一律料金の処理:', {
            flatRateFee: modalData.flatRateFee,
            minimumAcquisition: modalData.minimumAcquisition
          });
          incentiveData.flatRate = {
            fee: modalData.flatRateFee ? parseFloat(modalData.flatRateFee) : 0,
            minimumAcquisition: modalData.minimumAcquisition ? parseFloat(modalData.minimumAcquisition) : undefined
          };
          console.log('作成されたincentiveData:', incentiveData);
        }

        // バリデーション
        const validation = validateDataByType(DataType.INCENTIVE, incentiveData);
        if (!validation.isValid) {
          alert(formatValidationErrors(validation.errors));
          return;
        }

        if (editId) {
          await updateData(editId, incentiveData);
          alert('インセンティブデータを更新しました');
        } else {
          await createData(incentiveData);
          alert('インセンティブデータが正常に登録されました。');
        }
      }

      // モーダルをリセット
      resetModalData();
      setIsModalOpen(false);
      setEditId(null);
      
    } catch (error: any) {
      console.error('データ保存エラー:', error);
      alert(error.message || 'データの保存に失敗しました。');
    }
  };

  const openModal = () => {
    setIsModalOpen(true);
    
    // インセンティブが選択されている場合、デフォルト値を設定
    if (isIncentive) {
      // デフォルトのインセンティブタイプを設定
      if (!modalData.incentiveType) {
        updateModalData('incentiveType', 'feeTable');
      }
      
      // 手数料テーブルが未設定の場合、デフォルト値を設定
      if (modalData.incentiveType === 'feeTable' && (!modalData.feeTable || modalData.feeTable.length === 0)) {
        const defaultFeeTable = INCENTIVE_FEE_TABLE.map(fee => ({
          kwhRange: fee.kwhRange,
          minKwh: fee.minKwh.toString(),
          maxKwh: fee.maxKwh === Infinity ? '' : fee.maxKwh.toString(),
          fee: fee.fee.toString()
        }));
        updateModalData('feeTable', defaultFeeTable);
      }
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetModalData();
    setEditId(null);
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

  // インセンティブが選択されているかどうかをチェック
  const isIncentive = formData.buildingType === 'incentive';

  // 日付をフォーマットする関数
  const formatDate = (timestamp: any) => {
    if (!timestamp) return '-';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('ja-JP');
  };

  // 編集ボタンの処理
  const handleEdit = (data: any) => {
    setModalDataForEdit(data);
    setEditId(data.id);
    setIsModalOpen(true);
  };

  // 削除ボタンの処理
  const handleDelete = async (data: any) => {
    if (window.confirm(`${data.tradeName || data.id} を削除しますか？`)) {
      try {
        await deleteData(data.id);
        alert('データを削除しました');
        refreshData();
      } catch (error: any) {
        console.error('データ削除エラー:', error);
        alert(error.message || 'データの削除に失敗しました。');
      }
    }
  };

  // エラー表示
  if (error) {
    return (
      <DataEntryContainer>
        <div style={{ color: 'red', textAlign: 'center', padding: '2rem' }}>
          エラーが発生しました: {error}
        </div>
      </DataEntryContainer>
    );
  }

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
           isIncentive ? 'インセンティブデータ一覧' :
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
                ) : isIncentive ? (
                  <>
                    <TableHeader rowSpan={2}>商流</TableHeader>
                    <TableHeader rowSpan={2}>契約</TableHeader>
                    <TableHeader colSpan={12} style={{ textAlign: 'center', width: '600px' }}>指数（月毎）</TableHeader>
                    <TableHeader rowSpan={2}>手数料</TableHeader>
                    <TableHeader rowSpan={2}>適用開始日</TableHeader>
                    <TableHeader rowSpan={2}>作成日時</TableHeader>
                    <TableHeader rowSpan={2}>操作</TableHeader>
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
              {isIncentive && (
                <tr>
                  <TableHeader>1</TableHeader>
                  <TableHeader>2</TableHeader>
                  <TableHeader>3</TableHeader>
                  <TableHeader>4</TableHeader>
                  <TableHeader>5</TableHeader>
                  <TableHeader>6</TableHeader>
                  <TableHeader>7</TableHeader>
                  <TableHeader>8</TableHeader>
                  <TableHeader>9</TableHeader>
                  <TableHeader>10</TableHeader>
                  <TableHeader>11</TableHeader>
                  <TableHeader>12</TableHeader>
                </tr>
              )}
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
                      <IconButton onClick={() => handleDelete(data)} size="small">
                        <DeleteIcon />
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
                      <IconButton onClick={() => handleDelete(data)} size="small">
                        <DeleteIcon />
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
                      <IconButton onClick={() => handleDelete(data)} size="small">
                        <DeleteIcon />
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
                      <IconButton onClick={() => handleDelete(data)} size="small">
                        <DeleteIcon />
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
                      <IconButton onClick={() => handleDelete(data)} size="small">
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ) : isIncentive ? (
                  <TableRow key={data.id}>
                    <TableCell>{getTradeNameById(data.tradeId) || '-'}</TableCell>
                    <TableCell>{data.contract || '-'}</TableCell>
                    <TableCell>{data.monthlyIndices?.['1'] || '-'}</TableCell>
                    <TableCell>{data.monthlyIndices?.['2'] || '-'}</TableCell>
                    <TableCell>{data.monthlyIndices?.['3'] || '-'}</TableCell>
                    <TableCell>{data.monthlyIndices?.['4'] || '-'}</TableCell>
                    <TableCell>{data.monthlyIndices?.['5'] || '-'}</TableCell>
                    <TableCell>{data.monthlyIndices?.['6'] || '-'}</TableCell>
                    <TableCell>{data.monthlyIndices?.['7'] || '-'}</TableCell>
                    <TableCell>{data.monthlyIndices?.['8'] || '-'}</TableCell>
                    <TableCell>{data.monthlyIndices?.['9'] || '-'}</TableCell>
                    <TableCell>{data.monthlyIndices?.['10'] || '-'}</TableCell>
                    <TableCell>{data.monthlyIndices?.['11'] || '-'}</TableCell>
                    <TableCell>{data.monthlyIndices?.['12'] || '-'}</TableCell>
                    <TableCell>
                      <div style={{ fontSize: '0.8rem' }}>
                        {data.incentiveType === 'flatRate' ? (
                          <div>
                            <div>一律料金: {data.flatRate?.fee}円</div>
                            {data.flatRate?.minimumAcquisition && (
                              <div>最小獲得件数: {data.flatRate.minimumAcquisition}件</div>
                            )}
                          </div>
                        ) : (
                          data.feeTable?.map((fee: any, index: number) => (
                            <div key={index}>
                              {fee.kwhRange}: {fee.fee}円
                            </div>
                          ))
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{data.startDate || '-'}</TableCell>
                    <TableCell>{formatDate(data.createdAt)}</TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleEdit(data)} size="small">
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(data)} size="small">
                        <DeleteIcon />
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
                      <IconButton onClick={() => handleDelete(data)} size="small">
                        <DeleteIcon />
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
               isIncentive ? 'インセンティブデータ登録' :
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
              ) : isIncentive ? (
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
                    <Label>月次指数 *</Label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                      {MONTH_LIST.map(month => (
                        <div key={month.value}>
                          <Label style={{ fontSize: '0.9rem' }}>{month.label}</Label>
                          <Input
                            type="number"
                            step="0.01"
                            name={`monthlyIndex_${month.value}`}
                            value={modalData.monthlyIndices?.[month.value] || ''}
                            onChange={handleModalChange}
                            required
                            placeholder="指数"
                          />
                        </div>
                      ))}
                    </div>
                  </FormGroup>
                  <FormGroup>
                    <Label>インセンティブの設定パターン *</Label>
                    <Select
                      name="incentiveType"
                      value={modalData.incentiveType}
                      onChange={handleModalChange}
                      required
                    >
                      <option value="">選択してください</option>
                      <option value="feeTable">手数料テーブル</option>
                      <option value="flatRate">一律料金</option>
                    </Select>
                  </FormGroup>
                  
                  {modalData.incentiveType === 'feeTable' && (
                    <FormGroup>
                      <Label>手数料テーブル</Label>
                      <div style={{ marginBottom: '1rem' }}>
                        <Button 
                          type="button" 
                          onClick={() => {
                            const currentFeeTable = modalData.feeTable || [];
                            updateModalData('feeTable', [...currentFeeTable, { kwhRange: '', minKwh: '', maxKwh: '', fee: '' }]);
                          }}
                          style={{ marginBottom: '1rem' }}
                        >
                          手数料項目を追加
                        </Button>
                      </div>
                      {(modalData.feeTable || []).map((fee, index) => (
                        <div key={index} style={{ border: '1px solid #ddd', padding: '1rem', marginBottom: '1rem', borderRadius: '4px' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                            <div>
                              <Label style={{ fontSize: '0.9rem' }}>獲得件数範囲</Label>
                              <Input
                                type="text"
                                name={`feeTable_kwhRange_${index}`}
                                value={fee.kwhRange}
                                onChange={handleModalChange}
                                placeholder="例: 1-199"
                                required
                              />
                            </div>
                            <div>
                              <Label style={{ fontSize: '0.9rem' }}>最小kWh</Label>
                              <Input
                                type="number"
                                name={`feeTable_minKwh_${index}`}
                                value={fee.minKwh}
                                onChange={handleModalChange}
                                placeholder="1"
                                required
                              />
                            </div>
                            <div>
                              <Label style={{ fontSize: '0.9rem' }}>最大kWh</Label>
                              <Input
                                type="number"
                                name={`feeTable_maxKwh_${index}`}
                                value={fee.maxKwh}
                                onChange={handleModalChange}
                                placeholder="199（空欄で最大値なし）"
                              />
                            </div>
                            <div>
                              <Label style={{ fontSize: '0.9rem' }}>手数料（円）</Label>
                              <Input
                                type="number"
                                name={`feeTable_fee_${index}`}
                                value={fee.fee}
                                onChange={handleModalChange}
                                placeholder="5800"
                                required
                              />
                            </div>
                          </div>
                          <Button 
                            type="button" 
                            onClick={() => {
                              const currentFeeTable = modalData.feeTable || [];
                              const updatedFeeTable = currentFeeTable.filter((_, i) => i !== index);
                              updateModalData('feeTable', updatedFeeTable);
                            }}
                            style={{ marginTop: '0.5rem', backgroundColor: '#dc3545' }}
                          >
                            削除
                          </Button>
                        </div>
                      ))}
                    </FormGroup>
                  )}
                  
                  {modalData.incentiveType === 'flatRate' && (
                    <>
                      <FormGroup>
                        <Label>一律料金（円） *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          name="flatRateFee"
                          value={modalData.flatRateFee}
                          onChange={handleModalChange}
                          required
                          placeholder="例: 5000"
                        />
                      </FormGroup>
                      <FormGroup>
                        <Label>最小獲得件数（任意）</Label>
                        <Input
                          type="number"
                          step="0.01"
                          name="minimumAcquisition"
                          value={modalData.minimumAcquisition}
                          onChange={handleModalChange}
                          placeholder="例: 100（空欄で制限なし）"
                        />
                        <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.5rem' }}>
                          この件数以下の場合はインセンティブが適用されません
                        </div>
                      </FormGroup>
                    </>
                  )}
                  
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