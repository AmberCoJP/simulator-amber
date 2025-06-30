import React from 'react';
import styled from 'styled-components';

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

const FileInput = styled.input`
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

interface DataEntryModalProps {
  isOpen: boolean;
  isBusinessFlowSelected: boolean;
  modalData: {
    tradeName: string;
    registrationDate: string;
    iconImage: File | null;
  };
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

const DataEntryModal: React.FC<DataEntryModalProps> = ({ isOpen, isBusinessFlowSelected, modalData, onChange, onSubmit, onClose }) => {
  if (!isOpen) return null;
  return (
    <Modal>
      <ModalContent>
        <CloseButton onClick={onClose}>&times;</CloseButton>
        <ModalTitle>
          {isBusinessFlowSelected ? '商流一覧データ登録' : 'データ登録'}
        </ModalTitle>
        <form onSubmit={onSubmit}>
          {isBusinessFlowSelected ? (
            <>
              <FormGroup>
                <Label>商流名 *</Label>
                <Input
                  type="text"
                  name="tradeName"
                  value={modalData.tradeName}
                  onChange={onChange}
                  required
                />
              </FormGroup>
              <FormGroup>
                <Label>登録日</Label>
                <Input
                  type="date"
                  name="registrationDate"
                  value={modalData.registrationDate}
                  onChange={onChange}
                />
              </FormGroup>
              <FormGroup>
                <Label>アイコン画像</Label>
                <FileInput
                  type="file"
                  name="iconImage"
                  accept="image/*"
                  onChange={onChange}
                />
              </FormGroup>
            </>
          ) : null}
          <div>
            <Button type="submit">登録</Button>
            <Button type="button" onClick={onClose}>キャンセル</Button>
          </div>
        </form>
      </ModalContent>
    </Modal>
  );
};

export default DataEntryModal; 