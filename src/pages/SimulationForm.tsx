import React from 'react';
import styled from 'styled-components';

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

const SimulationForm: React.FC = () => {
  return (
    <Container>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title>入力画面</Title>
        <ManualLink href="#">手順書</ManualLink>
      </div>
      <form>
        <Row>
          <Select>
            <option>従量</option>
            <option>定額</option>
          </Select>
          <Select>
            <option>A</option>
            <option>B</option>
          </Select>
          <Label>地域</Label>
          <Select>
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
          <Label>使用量</Label>
          <Input type="number" min="0" />
          <span>kwh</span>
          <Checkbox type="checkbox" id="zero" />
          <Label htmlFor="zero" style={{ minWidth: 'auto', fontSize: '0.95rem' }}>使用量が0の場合</Label>
        </Row>
        <Row>
          <Label>現在(税込)</Label>
          <Input type="number" min="0" />
          <span>円</span>
        </Row>
        <Row>
          <Select style={{ width: '80px' }}>
            <option>2025</option>
            <option>2024</option>
          </Select>
          <span>年</span>
          <Select style={{ width: '60px' }}>
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
          <Input type="number" min="0" style={{ width: '70px' }} />
          <span>円</span>
        </Row>
        <Row>
          <Label style={{ minWidth: '40px' }}>朝</Label>
          <SmallInput type="number" min="0" max="100" />
          <span>%</span>
          <Label style={{ minWidth: '40px' }}>昼</Label>
          <SmallInput type="number" min="0" max="100" />
          <span>%</span>
          <Label style={{ minWidth: '40px' }}>夜</Label>
          <SmallInput type="number" min="0" max="100" />
          <span>%</span>
        </Row>
        <Row>
          <Label style={{ minWidth: 'auto' }}>検針日</Label>
          <DateInput type="date" />
          <span>～</span>
          <DateInput type="date" />
        </Row>
        <Button type="button">計算</Button>
      </form>
    </Container>
  );
};

export default SimulationForm; 