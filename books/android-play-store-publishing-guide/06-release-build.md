---
title: "リリースビルド（AAB）と最適化"
---

本章では、ストアにアップロードする署名済みの AAB をビルドします。「アプリに署名する」章で `keystore.properties` と `app/build.gradle.kts` の署名設定を済ませてあることを前提とします。

## Android App Bundle とは

Android App Bundle（AAB）は Google Play 専用の公開フォーマットです。AAB にはコードとリソースをすべて含めますが、APK の生成と署名は Google Play が担います。Google Play は端末ごとに最適化した APK を生成して配信するため、ユーザーのダウンロードサイズが小さくなります[^aab]。

[^aab]: AAB の詳細は [Android App Bundle について](https://developer.android.com/guide/app-bundle) を参照してください。

:::message
2021 年 8 月以降、新規アプリは AAB での公開が必須です。APK を直接アップロードして新規公開はできません。
:::

## リリース AAB をビルドする

次のコマンドで署名済みの AAB をビルドします。`./gradlew` は Gradle Wrapper を呼び出すコマンドで、`bundleRelease` は AAB を生成する Gradle タスクです（いずれも「前提知識と用語」章を参照）。

```bash
./gradlew bundleRelease
```

`./gradlew` は、プロジェクトのルートディレクトリ（Android Studio のターミナルなど）で実行します。Windows では `gradlew.bat bundleRelease` を使います。

成果物は `app/build/outputs/bundle/release/app-release.aab` に出力されます。APK を直接作る場合は `./gradlew assembleRelease` を使いますが、`assembleRelease` は APK を生成する Gradle タスクであり、Play への新規公開には AAB を使います。

## コード縮小（R8）

「アプリに署名する」章で `release` ビルドに `isMinifyEnabled` と `isShrinkResources` を設定しました。両方を有効にすると、未使用のコードとリソースを削除してアプリサイズを抑えられます[^r8]。コードを縮小するツールが R8 です。R8 は未使用コードの削除に加えて難読化を行います。難読化とは、クラス名やメソッド名を短い名前へ置き換える処理です。短縮後はクラッシュ時のスタックトレースが読めなくなるため、元の名前へ戻す対応表として `mapping.txt` が必要になります。`mapping.txt` は `app/build/outputs/mapping/release/mapping.txt` に出力され、Play Console にアップロードできます。

[^r8]: R8 によるコード縮小は [アプリを縮小、難読化、最適化する](https://developer.android.com/build/shrink-code) を参照してください。

本書の最小サンプルは、追加の keep ルールなしで `bundleRelease` が成功することを確認しています。keep ルールとは、R8 による削除や難読化の対象から特定のクラスやメソッドを除外する指定です。リフレクションや `kotlinx.serialization` などを使う場合は、`proguard-rules.pro` に keep ルールが必要になることがあります。

## 確認

- `./gradlew bundleRelease` が成功する。
- `app/build/outputs/bundle/release/app-release.aab` が生成される。
