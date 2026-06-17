---
title: "トラブルシューティング"
---

本章では、ビルド・署名・公開でよくある詰まりと対処をまとめます。

## ビルドの問題

### `kotlin-android` プラグインでビルドが失敗する

AGP 9.0 以降は Kotlin の組み込みサポートが既定で有効です。`com.android.application` と同時に `org.jetbrains.kotlin.android` プラグインを適用すると、次のエラーでビルドが止まります[^builtin]。

```text
The 'org.jetbrains.kotlin.android' plugin is no longer required for Kotlin support since AGP 9.0.
```

対処は、`org.jetbrains.kotlin.android` プラグインを削除することです。Compose を使う場合は、Compose コンパイラプラグインのみを適用します。

[^builtin]: 組み込み Kotlin への移行は [Migrate to built-in Kotlin](https://developer.android.com/build/migrate-to-built-in-kotlin) を参照してください。

### Compose コンパイラと Kotlin のバージョンが一致しない

Compose コンパイラプラグインのバージョンは、ビルドに使う Kotlin のバージョンと一致させます。AGP の組み込み Kotlin を使う場合は、Compose コンパイラプラグインのバージョンを、AGP が同梱する Kotlin のバージョンにそろえます。

### JDK が新しすぎて Gradle が動かない

Gradle は、対応するより新しい JDK では起動に失敗する場合があります。ビルドには、対応する JDK（本書では 17）を使います。Android Studio に同梱の JDK を使う場合は、`JAVA_HOME` を Android Studio の JBR のパスに設定します。

### SDK プラットフォームが見つからない

`compileSdk` に指定した API レベルのプラットフォームが無い場合、ビルドが失敗します。Android Studio の SDK Manager、または `sdkmanager` で対象の API レベルを導入します。

## 署名の問題

### 署名でビルドが失敗する

`./gradlew bundleRelease` が署名で失敗する場合、`keystore.properties` とキーストアが用意されているかを確認します。`storeFile` のパスは app モジュールからの相対パスで、`../upload-keystore.jks` はプロジェクト直下のキーストアを指します。

### アップロード鍵を紛失した

アップロード鍵を紛失した場合は、新しい鍵を作成し、Play Console からアップロード鍵のリセットを申請します[^reset]。リセットはアプリ署名鍵に影響しないため、同じアプリの更新を継続できます。

[^reset]: アップロード鍵のリセットは [アップロード鍵をリセットする](https://support.google.com/googleplay/android-developer/answer/7384423) を参照してください。

## ビルドの動作検証

本書のサンプルは、手元のツールチェーンでビルドを確認できます。検証手順は次のとおりです。

1. `JAVA_HOME` を JDK 17 以上（Android Studio の JBR など）に設定します。
2. `./gradlew :app:assembleDebug` でデバッグ APK のビルドを確認します。
3. キーストアと `keystore.properties` を用意し、`./gradlew :app:bundleRelease` で署名済み AAB のビルドを確認します。
4. 生成された AAB は `jarsigner -verify <aab のパス>` で署名を確認します。

本書のサンプル（AGP 9.2.1 / Kotlin 2.3.10 / Compose BOM 2026.05.01 / compileSdk 36）は、上記の手順でビルドと署名を確認しています。

## 公開・審査の問題

### 製品版が選べない

新規の個人アカウントは、クローズドテスト（12 人・14 日連続）を完了するまで製品版を公開できません。要件と手順は「テストとテスター運用」章を参照してください。

### 審査で却下される

審査で却下される主な原因は次のとおりです。

- プライバシーポリシーの未登録、またはアプリ内の導線の欠落。
- データセーフティの申告とアプリの実装の不一致。
- コンテンツのレーティングの未取得。
- ターゲット API レベルが要件を満たしていない。
- 広告 ID の宣言漏れ。

各宣言は「アプリのコンテンツを宣言する」章、ターゲット API レベルは「サンプルアプリを作る」章を参照してください。

## 確認

- ビルド・署名・公開で発生したエラーの原因を、本章で特定できる。
- 本書のサンプルが、手元のツールチェーンでビルドできる。
