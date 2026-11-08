# LINEベーカリー注文システム（パン屋向けの版）

ギフト向けに開発したLINE上の注文基盤（[line-egift-system](https://github.com/wataru-shiotsuki/line-egift-system)）を、パン屋向けに作り変えた版です。

## 何のため

小さなお店でも使えるかを確かめるため、LINE上で、注文から店頭での受け取りまでを記録する仕組みを作っています。お店の負担を増やさず、注文と支払いはLINEで済ませ、受け取りは店頭で行います。

## 何ができる

- 商品一覧の表示と、受け取り日を選んでの注文
- Stripeによる事前決済と、支払いの完了を注文に反映（Stripeのwebhook）
- 支払い済みの注文への、受け取り用QRの発行
- スタッフが、QRから確認画面を開き、暗証番号を入れて、受け取りを確認
- LINEのwebhookの受信
- 注文の状態の管理（未払い、支払い済み、受け取り済み）

## 使っている技術

- バックエンド：Node.js, Express
- フロントエンド：HTML, JavaScript
- データベース：Supabase (PostgreSQL)
- 決済：Stripe
- 受け取り：QRコード（qrcode）
- メッセージ：LINE Messaging API
- インフラ：Vercel

## 構成

- `public/`：商品の注文画面と、受け取りの確認画面
- `api/`：注文、Stripeのwebhook、LINEのwebhookの処理
- `lib/`：外部サービスのクライアント
- `migrations/schema.sql`：商品と注文のテーブル
- `scripts/seed-products.js`：サンプル商品3件

※お店の名前は非公開です。サンプルのコードで、実在の企業・店・データは含みません。
