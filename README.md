# Amber Simulator - 電力料金シミュレーションシステム

## 概要

Amber Simulatorは、電力小売事業者の料金計算をシミュレーションするWebアプリケーションです。複数の商流（電力会社）の料金を比較し、最適な電力プランを選択できるシステムです。

## 主な機能

### 1. 料金シミュレーション
- 複数商流の料金を同時計算
- 託送基本料、容量拠出金、電源料金、サービス料、託送従量料金、再エネ賦課金の詳細計算
- 政府支援控除の適用
- インセンティブ計算
- 使用量0の場合の特別処理（基本料金半額）

### 2. データ管理
- Firebase Firestoreを使用したデータベース管理
- 託送料金、容量拠出金、電源料金、サービス料、再エネ賦課金、インセンティブデータの管理
- JEPX月平均料金データの管理

### 3. ユーザー認証
- Firebase Authenticationを使用したログイン機能

## 技術スタック

### フロントエンド
- **React 18.2.0** - UIライブラリ
- **TypeScript 4.9.5** - 型安全性
- **Styled Components 6.1.8** - CSS-in-JS
- **Material-UI 5.18.0** - UIコンポーネントライブラリ
- **React Router 6.21.3** - ルーティング

### バックエンド・データベース
- **Firebase 10.14.1** - バックエンドサービス
  - **Firestore** - NoSQLデータベース
  - **Authentication** - ユーザー認証
  - **Storage** - ファイルストレージ

### 開発ツール
- **Create React App** - 開発環境
- **ESLint** - コード品質管理

## プロジェクト構造

```
amber-simulator/
├── public/                 # 静的ファイル
├── src/
│   ├── components/         # 再利用可能なコンポーネント
│   │   ├── common/        # 共通コンポーネント
│   │   ├── dataEntry/     # データ入力関連コンポーネント
│   │   └── simulation/    # シミュレーション関連コンポーネント
│   ├── constants/         # 定数定義
│   ├── firebase/          # Firebase設定・サービス
│   ├── hooks/             # カスタムフック
│   ├── pages/             # ページコンポーネント
│   │   ├── Login.tsx      # ログインページ
│   │   ├── DataEntry.tsx  # データ入力ページ
│   │   ├── DataList.tsx   # データ一覧ページ
│   │   ├── DataEntryModal.tsx # データ入力モーダル
│   │   └── SimulationForm.tsx # シミュレーションフォーム
│   ├── types/             # TypeScript型定義
│   ├── utils/             # ユーティリティ関数
│   ├── App.tsx            # メインアプリケーション
│   └── index.tsx          # エントリーポイント
├── package.json           # 依存関係
└── README.md             # このファイル
```

## 料金計算項目

### 1. 託送基本料
- 契約容量に応じた基本料金
- 従量A：6kW固定
- 従量B/C：ユーザー入力値
- 使用量0の場合：半額

### 2. 容量拠出金
- 契約容量 × 単価
- 使用量0の場合：半額

### 3. 電源料金
- JEPX月平均料金 × 使用量 ÷ (1 - エリア損失率) × 税率(1.1)
- 使用量0の場合：0円

### 4. サービス料
- サービス料単価 × 使用量
- 使用量0の場合：0円

### 5. 託送従量料金
- 託送従量単価 × 使用量
- 使用量0の場合：0円

### 6. 再エネ賦課金
- 再エネ賦課金単価 × 使用量
- 使用量0の場合：0円

### 7. 政府支援控除
- 政府支援単価 × 使用量
- 使用量0の場合：0円

### 8. インセンティブ
- 使用量 × 月次指数 = 獲得件数
- 獲得件数に応じた手数料
- 使用量0の場合：0円

## 契約種別について

### 現在の対応状況
- **従量契約**: 完全対応
  - 従量A（6kW固定）
  - 従量B（8kW以上、ユーザー入力）
  - 従量C（10kW以上、ユーザー入力）

- **動力契約**: **現在コメントアウト中**
  - 動力関連のコードはすべてコメントアウトされています
  - 契約種別選択肢から「動力」を削除
  - 動力関連の計算ロジックを無効化
  - 動力の契約容量設定を無効化

### 動力契約の復活方法
動力契約を再度有効にする場合は、以下の箇所のコメントアウトを解除してください：

1. `src/pages/SimulationForm.tsx`の定数定義
   ```typescript
   CONTRACT_TYPES: {
     VOLUME: '従量',
     // POWER: '動力'  // このコメントを解除
   },
   ```

2. 契約容量のデフォルト値
   ```typescript
   DEFAULT_VALUES: {
     CONTRACT_CAPACITY_A: 6,
     CONTRACT_CAPACITY_B: 8,
     CONTRACT_CAPACITY_C: 10,
     // CONTRACT_CAPACITY_POWER: 8  // このコメントを解除
   },
   ```

3. 契約種別選択肢
   ```typescript
   <option>{CONSTANTS.CONTRACT_TYPES.VOLUME}</option>
   {/* <option>{CONSTANTS.CONTRACT_TYPES.POWER}</option> */}  // このコメントを解除
   ```

4. 計算ロジック内の動力関連処理

## セットアップ

### 前提条件
- Node.js 16以上
- npm または yarn

### インストール
```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm start
```

### 環境設定
Firebaseの設定が必要です。`src/firebase/config.ts`に以下の設定を追加してください：

```typescript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-auth-domain",
  projectId: "your-project-id",
  storageBucket: "your-storage-bucket",
  messagingSenderId: "your-messaging-sender-id",
  appId: "your-app-id"
};
```

## 利用可能なスクリプト

### `npm start`
開発モードでアプリケーションを起動します。
[http://localhost:3000](http://localhost:3000) でアクセス可能です。

### `npm test`
テストランナーを起動します。

### `npm run build`
本番用のビルドを作成します。`build`フォルダに出力されます。

### `npm run eject`
**注意: この操作は元に戻せません！**
Create React Appの設定をカスタマイズする場合に使用します。

## データベース構造

### Firestore コレクション

#### trend
商流（電力会社）の基本情報
```typescript
{
  tradeId: string,
  tradeName: string
}
```

#### takuso_price
託送料金データ
```typescript
{
  tradeId: string,
  region: string,
  contract: string,
  startDate: string,
  basicPriceType: 'per_kw' | 'tiered',
  basicPrice?: number,
  basicPriceFirst6kw?: number,
  basicPriceOver6kw?: number,
  volumePrice: number
}
```

#### yoryo_price
容量拠出金データ
```typescript
{
  tradeId: string,
  region: string,
  contract: string,
  startDate: string,
  price: number
}
```

#### fuel_adjustment
エリア損失率データ
```typescript
{
  tradeId: string,
  region: string,
  contract: string,
  startDate: string,
  areaLossRate: number
}
```

#### jepx_monthly_data
JEPX月平均料金データ
```typescript
{
  date: string, // YYYY-MM形式
  areaAverages: {
    kansai: number,
    tokyo: number,
    chubu: number,
    // その他のエリア
  }
}
```

#### service_charge
サービス料データ
```typescript
{
  startDate: string,
  price: number
}
```

#### renewable_surcharge
再エネ賦課金データ
```typescript
{
  startDate: string,
  price: number
}
```

#### incentive
インセンティブデータ
```typescript
{
  tradeId: string,
  contract: string,
  startDate: string,
  incentiveType: 'flatRate' | 'feeTable',
  monthlyIndices: {
    [month: string]: number
  },
  flatRate?: {
    minimumAcquisition?: number,
    fee: number
  },
  feeTable?: Array<{
    minKwh: number,
    maxKwh: number,
    fee: number
  }>
}
```

## 開発者向け情報

### カスタムフック
- `useTradeData`: 商流データの管理
- `useCalculationLogic`: 料金計算ロジック
- `useDataCache`: データキャッシュ管理

### 型定義
主要な型定義は`src/types/index.ts`に集約されています。

### スタイリング
Styled Componentsを使用したCSS-in-JSアプローチを採用しています。

## 注意事項

1. **動力契約機能**: 現在はコメントアウトされています。必要に応じて復活させてください。
2. **Firebase設定**: 本番環境では適切なFirebase設定が必要です。
3. **データ整合性**: 料金データの整合性を保つため、定期的なデータ更新が必要です。
