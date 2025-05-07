import React, { useState } from 'react';
import styled from 'styled-components';

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
  &:hover {
    background-color: #0056b3;
  }
`;

const DataEntry: React.FC = () => {
  const [formData, setFormData] = useState({
    buildingType: '',
    floorArea: '',
    numberOfPeople: '',
    electricityUsage: '',
    peakDemand: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: データ登録処理の実装
    console.log('登録データ:', formData);
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
            <option value="office">オフィス</option>
            <option value="factory">工場</option>
            <option value="store">店舗</option>
            <option value="residential">住宅</option>
          </Select>
        </FormGroup>

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

        <div>
            <Button type="submit">データを登録</Button>
            <Button type="submit">登録済みデータを表示</Button>
        </div>
      </Form>
    </DataEntryContainer>
  );
};

export default DataEntry; 