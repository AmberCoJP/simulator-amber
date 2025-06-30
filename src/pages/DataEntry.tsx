import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy, updateDoc, doc, setDoc, where } from 'firebase/firestore';
import { db } from '../firebase/index.ts';
import { OPTION_LIST } from '../constants/index.ts';
import IconButton from '@mui/material/IconButton';
import EditIcon from '@mui/icons-material/Edit';
import PauseIcon from '@mui/icons-material/Pause';

const DataEntryContainer = styled.div`
  padding: 2rem;
  max-width: 800px;
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
    floorArea: '',
    numberOfPeople: '',
    electricityUsage: '',
    peakDemand: '',
  });

  const [modalData, setModalData] = useState({
    tradeName: '',
    registrationDate: '',
    iconImage: null as File | null,
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [registeredData, setRegisteredData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

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
      alert('開始日と終了日を指定してください');
      return;
    }
    setIsLoading(true);
    try {
      const q = query(
        collection(db, 'jepx_daily_data'),
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

  // コンポーネントマウント時にデータを取得
  useEffect(() => {
    fetchRegisteredData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleModalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, files } = e.target;
    if (name === 'iconImage' && files) {
      setModalData(prev => ({
        ...prev,
        [name]: files[0]
      }));
    } else if (name === 'csvFile' && files) {
      handleCsvFileUpload(files[0]);
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
          // 編集時はupdateDoc
          const ref = doc(db, 'trend', editId);
          await updateDoc(ref, {
            tradeName: modalData.tradeName,
            registrationDate: modalData.registrationDate || new Date().toISOString().split('T')[0],
            iconImage: modalData.iconImage ? modalData.iconImage.name : null,
            updatedAt: serverTimestamp(),
          });
          alert('データを更新しました');
        } else {
          // 新規登録
          const trendData = {
            tradeName: modalData.tradeName,
            registrationDate: modalData.registrationDate || new Date().toISOString().split('T')[0],
            iconImage: modalData.iconImage ? modalData.iconImage.name : null,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          };
          await addDoc(collection(db, 'trend'), trendData);
          alert('商流一覧データが正常に登録されました。');
        }
        setModalData({ tradeName: '', registrationDate: '', iconImage: null });
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
          floorArea: '',
          numberOfPeople: '',
          electricityUsage: '',
          peakDemand: '',
        });
        setCsvData([]);
        fetchRegisteredData();
      } catch (error: any) {
        console.error('Jepxデータ保存エラー:', error);
        alert('Jepxデータの保存に失敗しました。');
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

        {/* Jepxデータ選択時のみ日付範囲フォームを表示 */}
        {isJepxDataSelected && (
          <div style={{ margin: '1rem 0' }}>
            <label>開始日: <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} /></label>
            <label style={{ marginLeft: '1rem' }}>終了日: <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} /></label>
            <Button type="button" onClick={fetchJepxData}>検索</Button>
          </div>
        )}

        {!isBusinessFlowSelected && !isJepxDataSelected && (
          <>
            <FormGroup>
              <Label>商流</Label>
              <Input
                type="number"
                name="floorArea"
                value={formData.floorArea}
                onChange={handleChange}
                required
              />
            </FormGroup>

            <FormGroup>
              <Label>地域</Label>
              <Input
                type="number"
                name="numberOfPeople"
                value={formData.numberOfPeople}
                onChange={handleChange}
                required
              />
            </FormGroup>

            <FormGroup>
              <Label>契約</Label>
              <Input
                type="number"
                name="electricityUsage"
                value={formData.electricityUsage}
                onChange={handleChange}
                required
              />
            </FormGroup>

            <FormGroup>
              <Label>年</Label>
              <Input
                type="number"
                name="peakDemand"
                value={formData.peakDemand}
                onChange={handleChange}
                required
              />
            </FormGroup>
          </>
        )}

        {isJepxDataSelected && (
          <>
            <FormGroup>
              <Label>地域</Label>
              <Input
                type="text"
                name="numberOfPeople"
                value={formData.numberOfPeople}
                onChange={handleChange}
                placeholder="地域を入力してください"
                required
              />
            </FormGroup>

            <FormGroup>
              <Label>期間</Label>
              <Input
                type="text"
                name="peakDemand"
                value={formData.peakDemand}
                onChange={handleChange}
                placeholder="期間を入力してください"
                required
              />
            </FormGroup>
          </>
        )}

        <div>
          <Button type="button" onClick={openModal}>データ登録</Button>
          <Button type="button" onClick={fetchRegisteredData}>登録済みデータを表示</Button>
        </div>
      </Form>

      {/* 登録済みデータ一覧 */}
      <DataList>
        <DataListTitle>{isJepxDataSelected ? 'Jepx日毎データ一覧' : '登録済みデータ一覧'}</DataListTitle>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>読み込み中...</div>
        ) : registeredData.length > 0 ? (
          <DataTable>
            <thead>
              <tr>
                {isJepxDataSelected ? (
                  <>
                    <TableHeader>日付</TableHeader>
                    <TableHeader>システムプライス</TableHeader>
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
                    <TableCell>{data.systemAverage ?? '-'}</TableCell>
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
              {isBusinessFlowSelected ? '商流一覧データ登録' : isJepxDataSelected ? 'Jepxデータ登録' : 'データ登録'}
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
              ) : (
                <>
                  <FormGroup>
                    <Label>商流</Label>
                    <Input
                      type="number"
                      name="floorArea"
                      value={formData.floorArea}
                      onChange={handleChange}
                      required
                    />
                  </FormGroup>
                  <FormGroup>
                    <Label>地域</Label>
                    <Input
                      type="number"
                      name="numberOfPeople"
                      value={formData.numberOfPeople}
                      onChange={handleChange}
                      required
                    />
                  </FormGroup>
                  <FormGroup>
                    <Label>契約</Label>
                    <Input
                      type="number"
                      name="electricityUsage"
                      value={formData.electricityUsage}
                      onChange={handleChange}
                      required
                    />
                  </FormGroup>
                  <FormGroup>
                    <Label>年</Label>
                    <Input
                      type="number"
                      name="peakDemand"
                      value={formData.peakDemand}
                      onChange={handleChange}
                      required
                    />
                  </FormGroup>
                </>
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