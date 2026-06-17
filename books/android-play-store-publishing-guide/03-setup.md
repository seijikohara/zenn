---
title: "開発環境とアカウントの準備"
---

本章では、開発に必要なツールと、Google Play デベロッパーアカウントを準備します。アカウントの本人確認には数日かかる場合があるため、早めに着手してください。

## 開発環境を整える

Android アプリの開発には [Android Studio](https://developer.android.com/studio) を使います。執筆時点の最新安定版[^stable]はコードネーム Quail（バージョン 2026.1.1）です。Android Studio には JDK[^jdk] が同梱されるため、ローカルのビルドに別途 JDK を用意する必要はありません[^jdk-ci]。

[^stable]: 安定版（stable）は、十分なテストを経て一般提供されるバージョンを指します。開発中の機能を含むプレビュー版（Canary・Beta・RC）とは別の配信チャネルで提供されます。
[^jdk]: JDK は Java Development Kit の略で、Java/Kotlin で書いたコードをビルドするためのツール一式です。
[^jdk-ci]: CI[^ci] では Android Studio に頼らず JDK を個別に用意します。詳細は「GitHub Actions で自動リリース」章で扱います。
[^ci]: CI は Continuous Integration（継続的インテグレーション）の略で、コードの変更をきっかけにビルドやテストを自動で実行する仕組みです。本書では「GitHub Actions で自動リリース」章で扱います。

### Android Studio をインストールする

Android Studio は OS ごとに配布形式が異なります。次の手順は [Install Android Studio](https://developer.android.com/studio/install) に基づきます。

まず、[Android Studio のダウンロードページ](https://developer.android.com/studio)を開き、利用中の OS（Windows・macOS・Linux）向けのインストーラを取得します。取得したインストーラを次のように実行します。

| OS | 実行手順 |
| --- | --- |
| Windows | ダウンロードした `.exe` ファイルをダブルクリックし、画面の指示に従う |
| macOS | DMG ファイルを開き、Android Studio を Applications フォルダにドラッグする |
| Linux | `.tar.gz` を `/opt` などに展開し、`android-studio/bin/` で `studio` を実行する |

インストール後に Android Studio を起動します。初回起動では、以前の設定を取り込むかどうかを尋ねられます。新規インストールでは取り込む設定がないため、そのまま進めます。

### Setup Wizard で SDK を取得する

初回起動時に Setup Wizard（セットアップウィザード）が開きます。Setup Wizard は、開発に必要な Android SDK[^sdk] のコンポーネントをダウンロードし、開発環境を構成します。画面の指示に従い、推奨される SDK パッケージをインストールします。ダウンロード容量は数 GB に及ぶ場合があり、回線速度によっては完了まで時間がかかります。

[^sdk]: SDK は Software Development Kit の略で、特定のプラットフォーム向けの開発に必要なライブラリやツールをまとめたものです。Android SDK には、ビルドツールやプラットフォームのライブラリが含まれます。

### 新規プロジェクトを作成して動作を確認する

Setup Wizard の完了後、新規プロジェクトを作成できることを確認します。手順は [Create a project](https://developer.android.com/studio/projects/create-project) に基づきます。

1. Welcome 画面で **New Project** を選びます。
2. **Templates** ペインから **Empty Activity** を選び、**Next** を押します。
3. **Name**（プロジェクト名）・**Package name**（パッケージ名）・**Save location**（保存先）・**Language**（言語、Kotlin を推奨）・**Minimum API level**（最小 API レベル）を設定します。
4. **Finish** を押します。

プロジェクトが生成され、コードとリソースの初期構成が表示されれば、開発環境の構成は完了です。具体的なサンプルアプリの作成は「サンプルアプリを作る」章で扱います。

### 動作確認の環境を用意する

ビルドしたアプリの動作確認には、Android Studio に同梱のエミュレータ[^emulator]、または開発者向けオプションを有効化した実機を使います。

[^emulator]: エミュレータは、PC 上で Android 端末の挙動を再現するソフトウェアです。実機がなくても、画面サイズや API レベルの異なる仮想端末でアプリを動かせます。

#### エミュレータを Device Manager で作成する

エミュレータは AVD（Android Virtual Device、仮想端末）として作成します。手順は [Create and manage virtual devices](https://developer.android.com/studio/run/managing-avds) に基づきます。

1. Welcome 画面では **More Actions > Virtual Device Manager** を選びます。プロジェクトを開いている場合は **View > Tool Windows > Device Manager** を選び、**+** を押して **Create Virtual Device** を選びます。
2. **Select Hardware** 画面でハードウェアプロファイル（Pixel 系など）を選び、**Next** を押します。
3. **System Image** 画面で API レベルに対応するシステムイメージを選びます。ダウンロードアイコンが表示される場合は、押してイメージを取得します。取得後に **Next** を押します。
4. **Verify Configuration** 画面で設定を確認し、**Finish** を押します。

作成した AVD は Device Manager の **Virtual** タブに表示され、起動できます。

#### 実機で開発者向けオプションを有効化する

実機を使う場合は、開発者向けオプション（Developer options）と USB デバッグ（USB debugging）を有効化します。手順は [Configure on-device developer options](https://developer.android.com/studio/debug/dev-options) に基づきます。端末や Android のバージョンによって設定項目の場所が異なるため、次は Google Pixel を例とします。

1. **設定 > デバイス情報 > ビルド番号**（Settings > About phone > Build number）を開きます。
2. **ビルド番号** を 7 回続けてタップします。「これでデベロッパーになりました」と表示されれば、開発者向けオプションが有効になります。
3. **設定 > システム > 開発者向けオプション**（Settings > System > Developer options）を開き、**USB デバッグ** を有効にします。
4. USB ケーブルで端末を PC に接続します。端末側で USB デバッグの許可を求められた場合は許可します。

:::message
開発者向けオプションを有効にすると、システムの動作を変更する設定が利用可能になります。意図しない設定変更は端末の動作に影響します。USB デバッグ以外の項目は、必要が生じるまで変更しないでください。
:::

## 必要なものを用意する

登録の前に、次のものを用意します。

| 必要なもの | 用途 |
| --- | --- |
| Google アカウント | デベロッパー登録に使用 |
| クレジットカードまたはデビットカード | 登録料 US$25 の支払いに使用 |
| 政府発行の本人確認書類 | 本人確認に使用 |

## デベロッパーアカウントを登録する

[Google Play Console](https://play.google.com/console) でデベロッパーアカウントを作成します。登録料は US$25 で、一度だけ支払います[^fee]。年会費は発生しません。

[^fee]: 登録料の詳細は [Play Console を使ってみる](https://support.google.com/googleplay/android-developer/answer/6112435) を参照してください。

登録は、利用規約への同意、デベロッパー情報の入力、登録料の支払い、本人確認情報の提出の順で進みます。入力した情報の一部は Google Play 上で公開されます。公開される情報はアカウント種別で異なるため、種別を選ぶ前に次節を確認してください。

### アカウント種別を選ぶ

登録時に、個人アカウントと組織アカウントのどちらかを選びます。両者の機能は同じですが、必要な情報と公開される情報が異なります[^account-type]。

| 項目 | 個人アカウント | 組織アカウント |
| --- | --- | --- |
| 想定用途 | 個人開発者・学習用途 | 商用・法人・政府機関 |
| 追加で必要な情報 | 政府発行の本人確認書類 | 本人確認書類・組織の公式書類・Web サイト・D-U-N-S 番号 |
| 公開される情報 | 法的氏名・国・連絡先メール | 法的名称・住所・連絡先メール・電話番号 |

[^account-type]: アカウント種別の違いは [デベロッパー アカウントの種類を選択する](https://support.google.com/googleplay/android-developer/answer/13634885) を参照してください。

:::message alert
金融・健康・VPN・政府関連のアプリは、個人アカウントでは配信できず、組織アカウントが必要です。該当するアプリを予定している場合は、組織アカウントで登録してください。組織アカウントの D-U-N-S 番号[^duns]は、取得に最大 30 日かかる場合があります。
:::

[^duns]: D-U-N-S 番号は、Dun & Bradstreet 社が事業者に発行する 9 桁の識別番号です。組織アカウントの登録では、組織の実在を確認する目的で提出を求められます。

### 本人確認を済ませる

登録の過程で本人確認を求められます。個人アカウントでは、政府発行の本人確認書類、法的氏名と住所、確認済みのメールアドレスが必要です。組織アカウントでは、追加で D-U-N-S 番号・組織の公式書類・電話番号・Web サイトの確認が必要です[^verify]。本人確認には数日かかる場合があります。

[^verify]: 本人確認の要件は [本人確認情報を確認する](https://support.google.com/googleplay/android-developer/answer/10841920) を参照してください。

新規の個人アカウントには、製品版の公開前にクローズドテストを完了する要件があります。要件と進め方は「テストとテスター運用」章で説明します。

:::message
2025 年から 2026 年にかけて、Android デベロッパー認証（Android developer verification）が段階的に導入されています。認証済みのデベロッパー以外のアプリは、対象国の認定 Android 端末にインストールできなくなる方向です。Google Play での配信にも関わるため、公式の[デベロッパー認証ページ](https://developer.android.com/developer-verification)で最新状況を確認してください。
:::

## 確認

- Android Studio をインストールし、Setup Wizard で SDK を取得できている。
- 新規プロジェクトを作成でき、エミュレータまたは実機で動作確認の準備が整っている。
- Google Play Console にログインでき、デベロッパーアカウントが作成されている。
- 登録料 US$25 の支払いが完了している。
- 本人確認の手続きを開始している（完了まで数日かかる場合があります）。
