# LINEベーカリー注文システム（パン屋向けの版）

ギフト向けに開発したLINE上の注文基盤（`line-egift-system`）を、小さなお店向けに作り変えた版です。企画・設計・実装を担当しています。

## 課題

ネットとお店をつなぐ仕組みは、導入するお店が限られています。特に小さなお店ほど、データを取る負担や手数料が壁になると考えました。ギフト向けに作った仕組みの価値を、実証に先立って小さなお店で確かめるため、パン屋向けに作り変えています。

## アプローチ

LINEで注文と支払いを済ませ、受け取りは店頭にします。お店の負担を増やさず、注文から受け取りまでを記録できるかを確かめます。記録をもとに、見せ方や案内を変えた場合に購買行動がどう変わるかを調べることを見据えています。

## 主な機能

- 商品一覧と注文
- Stripeによる事前決済
- 受け取り用QRの発行と、スタッフの暗証番号による受け取りの確認
- LINEのwebhookの受信

## 技術設計の考え方

Vercel・Supabase・Stripe・LINE Messaging APIを役割ごとに組み合わせ、自前実装は、注文・決済後の処理・受け取りの状態管理に集中しています。

## 担当範囲

企画、設計、実装、お店への提案。実装は、AIエージェント（Claude Code、Codex）も活用し、仕様と設計の判断は自分で行っています。

## 技術スタック

- バックエンド：Node.js, Express
- フロントエンド：HTML/JavaScript
- データベース：Supabase (PostgreSQL)
- 決済：Stripe
- 受け取り：QRコード（qrcode）
- メッセージ：LINE Messaging API
- インフラ：Vercel

## 構成

- `public/`：商品の注文画面と、受け取りQRの確認画面
- `api/`：注文、Stripeのwebhook、LINEのwebhookの処理
- `lib/`：外部サービスのクライアント
- `migrations/schema.sql`：商品と注文のテーブル
- `scripts/seed-products.js`：サンプル商品3件

## 動かし方

`npm install` で依存を入れます。Supabaseのデータベースに `migrations/schema.sql` を適用し、サンプル商品が必要なら `node scripts/seed-products.js` を実行します。`.env.example` の項目を、環境変数に設定します。`BASE_URL` は公開サイトのURL、`STAFF_PIN` は受け取りの確認に使います。LINEのwebhookは `/webhook`、Stripeのwebhookは `/stripe-webhook` に設定します。ローカルでは `npm run vercel-dev` で動かします。

## 現在の状況

お店に提案し、実施に向けて準備しています。

※お店の名前は非公開としています。サンプルのコードで、実在の企業・店・データは含みません。実際に使う前に、設定をすべて置き換え、処理の流れを確認してください。
