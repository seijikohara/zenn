---
title: "前提知識と用語"
---

本章では、本書で繰り返し登場する用語をまとめます。

:::message
各章で初めて出てきた語の意味が分からない場合は、本章に戻って確認してください。すべてを暗記する必要はありません。
:::

## ビルドとツール

| 用語 | 説明 |
| --- | --- |
| Gradle | Android アプリのビルドツール。依存ライブラリの取得・コンパイル・パッケージ化を行う |
| Android Gradle Plugin（AGP） | Gradle 上で Android 用のビルドを担うプラグイン |
| Gradle Wrapper（`./gradlew`） | プロジェクトに同梱された Gradle 実行スクリプト。Windows では `gradlew.bat` |
| Gradle タスク | `bundleRelease` など、Gradle が実行する処理の単位 |
| バージョンカタログ（`libs.versions.toml`） | 依存とプラグインのバージョンを 1 つのファイルにまとめる仕組み |
| BOM（Bill of Materials） | 関連する複数ライブラリのバージョンをまとめてそろえる仕組み |

## アプリの構成要素

| 用語 | 説明 |
| --- | --- |
| Activity | Android アプリの画面の単位 |
| Jetpack Compose | Kotlin のコードで画面（UI）を組み立てる Android の UI ツールキット |
| Composable（`@Composable`） | Compose で画面の部品を定義する関数 |
| APK | 端末にインストールできる Android アプリの実行ファイル |
| AAB（Android App Bundle） | Google Play 専用の公開フォーマット。配信用 APK の生成は Google Play が行う |
| R8 | 未使用コードの削除と、クラス名などの短縮（難読化）を行う最適化ツール |

## 識別子とバージョン

| 用語 | 説明 |
| --- | --- |
| `applicationId` | 配布時のアプリを一意に識別する ID。公開後は変更できない |
| `namespace` | ソースコードのパッケージ名。`R` クラスや `BuildConfig` の名前空間 |
| `versionCode` | 内部のバージョン番号（整数）。更新ごとに増やす |
| `versionName` | ユーザーに表示するバージョン文字列 |
| API レベル | Android のバージョンに対応する番号。Android 16 は API 36 |
| `compileSdk` / `targetSdk` / `minSdk` | コンパイルに使う / 動作対象として宣言する / 動作する最小の、各 API レベル |

## 署名

| 用語 | 説明 |
| --- | --- |
| 鍵ペア | 秘密鍵で署名し、対応する公開鍵で検証する暗号方式の鍵の組 |
| キーストア（`.jks`） | 署名に使う鍵を保管するファイル |
| アップロード鍵 | 開発者が AAB に署名する鍵。紛失してもリセットできる |
| アプリ署名鍵 | Google が配信用 APK に署名する鍵。Google が保管する |
| Play アプリ署名 | アップロード鍵とアプリ署名鍵を分け、最終的な署名を Google に任せる仕組み |

## 公開と配信

| 用語 | 説明 |
| --- | --- |
| 配信トラック | 内部テスト・クローズドテスト・オープンテスト・製品版という、配信先の段階 |
| オプトイン | テスターがテストへの参加に同意して登録すること |
| 段階的公開（staged rollout） | 一部のユーザーから順に配信範囲を広げる公開方法 |
| IARC | 1 回の質問票への回答で、各地域の年齢レーティングを発行する仕組み |
| 広告 ID | 広告のために端末ごとに割り当てられる識別子 |
| CI（継続的インテグレーション） | コードの変更ごとに、ビルドやテストを自動で実行する仕組み |

## CI と自動化

| 用語 | 説明 |
| --- | --- |
| GitHub Actions | GitHub 上でビルドや配信を自動実行する CI サービス |
| ワークフロー | GitHub Actions が実行する処理の定義。YAML ファイルで書く |
| YAML | 設定を階層で記述するテキスト形式 |
| タグ（Git） | コミットに付ける目印。`v1.0.0` などのバージョンに使う |
| サービスアカウント | プログラムが API を使うための、人ではない Google アカウント |
| JSON 鍵 | サービスアカウントの認証情報を収めたファイル |
| Google Cloud / プロジェクト | Google のクラウドサービス。API の有効化やサービスアカウントを管理する単位 |
| GitHub Secrets | GitHub に暗号化して保存する秘密情報（鍵やパスワードなど） |
| base64 | バイナリを文字列に変換する方式。鍵ファイルを Secrets に入れるときに使う |

## 収益化と課金

| 用語 | 説明 |
| --- | --- |
| AdMob | Google の広告配信サービス。アプリに広告を表示して収益を得る |
| 広告ユニット | 広告を表示する枠。広告ユニット ID で識別する |
| 決済プロファイル | 有料販売の代金を受け取るための、Google payments center の登録情報 |
| Google Play Billing | アプリ内でデジタル商品を販売するための Google Play の課金の仕組み |
| `BillingClient` | Play Billing をアプリから呼び出す中心のクラス |
| `ProductDetails` | 価格や名称など、商品の情報 |
| `offerToken` | 購入する商品のオファー（販売条件）を指す文字列。購入フローで渡す |
| acknowledge（確認） | 購入を受け取ったと Google へ通知する操作。期限内に行わないと返金される |
| consume（消費） | 消費型の商品を使い切り、再購入できるようにする操作 |
| ライセンステスター | 実際の課金なしに購入をテストできる、登録済みのテスター |
| base plan / offer | サブスクの課金構成（base plan）と、その販促のバリエーション（offer） |
| RTDN | Real-time Developer Notifications。購入状態の変化をサーバーへ通知する仕組み |
| Cloud Pub/Sub | メッセージを送受信する Google Cloud のサービス。RTDN の通知の配送に使う |
| `purchaseToken` | 購入ごとに発行される一意のトークン。サーバーでの購入検証に使う |
| Google Play Developer API | 購入の検証やリリース操作を、サーバーから行うための Google の API |
