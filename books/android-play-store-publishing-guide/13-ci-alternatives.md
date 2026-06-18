---
title: "CI の別解"
---

本章は、「GitHub Actions で自動リリース」章で扱った `r0adkll/upload-google-play` 以外の配信手段を扱います。AAB のアップロードには、`r0adkll/upload-google-play` 以外にも選択肢があります。Gradle のタスクとして公開する方法と、CI に依存しない配信ツールを使う方法を順に説明します。

サービスアカウントの作成と権限付与、および GitHub Secrets の登録は、「GitHub Actions で自動リリース」章と共通です。本章で扱う各手段も、同じサービスアカウント JSON 鍵で認証します。

## Gradle Play Publisher を使う場合

Gradle Play Publisher は、Gradle のタスクとして公開まで実行できるプラグインです[^gpp]。

[^gpp]: 設定と利用方法は [Gradle Play Publisher](https://github.com/Triple-T/gradle-play-publisher) を参照してください。

```kotlin:app/build.gradle.kts
plugins {
    id("com.android.application")
    id("com.github.triplet.play") version "4.0.0"
}

play {
    serviceAccountCredentials.set(file("service-account.json"))
    track.set("internal")
    defaultToAppBundles.set(true)
}
```

`./gradlew publishReleaseBundle` で AAB を配信します。

:::message
CI では、鍵をファイルへ置かず、環境変数 `ANDROID_PUBLISHER_CREDENTIALS` へ JSON の中身を渡せます。
:::

:::message
バージョン 4.0.0 は AGP 9 に対応します。AGP 8 以前のプロジェクトでは、バージョン 3.13.0 を使います。
:::

## fastlane を使う場合

fastlane の `supply`（別名 `upload_to_play_store`）は、CI に依存しない配信ツールです[^fastlane]。iOS と共通で運用するチームへ向いています。

[^fastlane]: 設定と利用方法は [fastlane upload_to_play_store](https://docs.fastlane.tools/actions/upload_to_play_store/) を参照してください。

```ruby:fastlane/Fastfile
default_platform(:android)

platform :android do
  desc "Build and deploy to Play Store internal track"
  lane :internal do
    gradle(task: "bundleRelease")
    upload_to_play_store(
      track: "internal",
      release_status: "completed",
      aab: "app/build/outputs/bundle/release/app-release.aab",
      json_key_data: ENV["SUPPLY_JSON_KEY_DATA"],
      skip_upload_metadata: true,
      skip_upload_images: true,
      skip_upload_screenshots: true,
    )
  end
end
```

`json_key_data` には、GitHub Secret から渡したサービスアカウント JSON の中身を指定します。

## バージョン早見表

CI で使うツールの 2026 年 6 月時点のバージョンです。

| 対象 | バージョン |
| --- | --- |
| r0adkll/upload-google-play | v1.1.5（`@v1`） |
| Gradle Play Publisher | 4.0.0（AGP 8 以前は 3.13.0） |
| fastlane | 2.236.1 |
| actions/checkout | v6 |
| actions/setup-java | v5 |
| gradle/actions/setup-gradle | v6 |

:::message
サプライチェーン対策として、Action をコミット SHA で固定する方法もあります。サービスアカウントの権限は最小限に保ち、シークレットはログへ出力しないよう注意します。
:::

## 確認

- 配信手段の選択肢として、Gradle Play Publisher と fastlane の構成を把握している。
- 各手段がサービスアカウント JSON 鍵で認証することを理解している。
- CI で使うツールのバージョンを確認している。
