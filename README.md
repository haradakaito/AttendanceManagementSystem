# 【Raspberry Pi】カードリーダー式在籍確認システム

## システム概要図

![システム概要図](https://github.com/user-attachments/assets/1fea2e5b-807d-4a1a-aff4-faba01869e9d)

## クラウド環境

- AWS Cloud（クラウドサーバー）

| APIサーバー          | データベース | アクセス制限 | 監視       |
----                  |----         |----         |----
| API Gateway, Lambda | DynamoDB    | IAM, WAF    | CloudWatch |

## 仕様定義

- 「NFCカードID」と「ユーザー名」を登録可能
- 同一ユーザーで複数のNFCカードIDを登録可能
- 同一NFCカードIDで複数のユーザーは登録不可能
- 登録済みNFCカードIDで在籍情報を登録可能
- 在籍情報は「出勤」「休入」「休出」「退勤」の4つ
- 在籍情報の変更時に現在籍情報は考慮しない
- 毎日AM0:00に全ユーザーの在籍情報が「退勤」にリセット

## 非機能要件

- AWS API Gatewayの全てのエンドポイントへのアクセスはIAM情報・APIキー・WAFで制御
- Lambda関数は各ロジック実行を完了可能な最小の許可ポリシーを設定
- IAM情報も各デバイスがタスク実行を完了可能な最小の許可ポリシーを設定
- Raspberry Piはパスワード認証不可とし，公開鍵暗号のみの認証に設定
- Raspberr Pi内部に長期間ユーザー情報や在籍情報は保持しない
- ローカルAPIエンドポイントへのアクセス時にも認証を設定

## 補足：TODO

- バッファ改良
  - リトライ機能
- UI/UX改善
  - 背景追加
  - サウンド追加
- セキュリティ強化
  - ローカルAPIサーバーの認証
