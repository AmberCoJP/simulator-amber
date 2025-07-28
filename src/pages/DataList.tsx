import React from 'react';
import styled from 'styled-components';
import IconButton from '@mui/material/IconButton';
import EditIcon from '@mui/icons-material/Edit';
import PauseIcon from '@mui/icons-material/Pause';

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

interface DataListProps {
  data: any[];
  isLoading: boolean;
  onEdit: (row: any) => void;
  onPause: (row: any) => void;
  formatDate: (timestamp: any) => string;
}

const DataListComponent: React.FC<DataListProps> = ({ data, isLoading, onEdit, onPause, formatDate }) => (
  <DataList>
    <DataListTitle>登録済みデータ一覧</DataListTitle>
    {isLoading ? (
      <div style={{ textAlign: 'center', padding: '2rem' }}>読み込み中...</div>
    ) : data.length > 0 ? (
      <DataTable>
        <thead>
          <tr>
            <TableHeader>商流名</TableHeader>
            <TableHeader>登録日</TableHeader>
            <TableHeader>アイコン画像</TableHeader>
            <TableHeader>作成日時</TableHeader>
            <TableHeader>操作</TableHeader>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <TableRow key={row.id}>
              <TableCell>{row.tradeName || '-'}</TableCell>
              <TableCell>{row.registrationDate || '-'}</TableCell>
              <TableCell>{row.iconImage || '-'}</TableCell>
              <TableCell>{formatDate(row.createdAt)}</TableCell>
              <TableCell>
                <IconButton onClick={() => onEdit(row)} size="small">
                  <EditIcon />
                </IconButton>
                <IconButton onClick={() => onPause(row)} size="small">
                  <PauseIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </tbody>
      </DataTable>
    ) : (
      <NoDataMessage>登録済みのデータがありません。</NoDataMessage>
    )}
  </DataList>
);

export default DataListComponent; 