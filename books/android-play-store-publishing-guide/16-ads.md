---
title: "広告で収益化する"
---

本章では、Google AdMob[^admob] を使って、アプリにバナー広告を表示する最小の手順を扱います。アプリは無料で配り、広告で収益を得ます。広告の収益は広告ネットワークから受け取るため、Google Play の決済プロファイルは不要です。

[^admob]: AdMob の導入は [AdMob クイックスタート](https://developers.google.com/admob/android/quick-start) を参照してください。

:::message
本章のコードは要点を示す最小の骨格です。実際のアプリでは、エラー処理・状態管理・画面調整を加えます。完全な実装は公式ドキュメントを参照してください。
:::

## 依存を追加する

Google Mobile Ads SDK を追加します。執筆時点の最新版は 25.3.0 です。SDK は minSdk 23 以上、Kotlin 2.1.0 以上を必要とします[^admob-relnotes]。

```kotlin:app/build.gradle.kts
dependencies {
    implementation("com.google.android.gms:play-services-ads:25.3.0")
}
```

[^admob-relnotes]: SDK の要件は [リリースノート](https://developers.google.com/admob/android/rel-notes) を参照してください。

## アプリ ID を設定する

AndroidManifest に AdMob のアプリ ID を設定します。設定が無いと、アプリが起動時にクラッシュします。次はテスト用のサンプルアプリ ID です。本番では、自分の AdMob アプリ ID に置き換えます。

```xml:app/src/main/AndroidManifest.xml
<application
    android:name=".MyApplication"
    ...>
    <meta-data
        android:name="com.google.android.gms.ads.APPLICATION_ID"
        android:value="ca-app-pub-3940256099942544~3347511713" />
</application>
```

アプリ ID は区切りがチルダ（`~`）、広告ユニット ID はスラッシュ（`/`）です。

## SDK を初期化する

アプリの起動時に一度だけ SDK を初期化します。`Application` クラスで、バックグラウンドのスレッドから初期化します。

```kotlin:app/src/main/java/com/example/mycomposeapp/MyApplication.kt
class MyApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        CoroutineScope(Dispatchers.IO).launch {
            MobileAds.initialize(this@MyApplication) {}
        }
    }
}
```

`Application` クラスは、AndroidManifest の `<application>` 要素に `android:name=".MyApplication"` を加えて登録します。属性を加える位置は、「アプリ ID を設定する」節の `<application>` の例を参照してください。

## バナー広告を表示する

Jetpack Compose では、`AndroidView` で `AdView` をラップして表示します[^banner]。次はテスト用の広告ユニット ID を使う例です。`BannerAd` は画面を組み立てる Composable[^compose-api] で、`MainActivity` の `setContent` の中から呼び出します。次のコードはファイル名注記のない断片で、`import` を省略しています。

[^banner]: バナー広告の実装は [バナー広告](https://developers.google.com/admob/android/banner) を参照してください。
[^compose-api]: `LocalInspectionMode`・`LocalContext`・`remember`・`DisposableEffect` は Jetpack Compose の API です。Compose の概要は「前提知識と用語」章を参照してください。

```kotlin
private const val BANNER_AD_UNIT_ID = "ca-app-pub-3940256099942544/9214589741"

@Composable
fun BannerAd(modifier: Modifier = Modifier) {
    if (LocalInspectionMode.current) return
    val context = LocalContext.current
    val adView = remember {
        AdView(context).apply {
            adUnitId = BANNER_AD_UNIT_ID
            setAdSize(AdSize.getLargeAnchoredAdaptiveBannerAdSize(context, 360))
            loadAd(AdRequest.Builder().build())
        }
    }
    AndroidView(modifier = modifier, factory = { adView })
    DisposableEffect(Unit) {
        onDispose { adView.destroy() }
    }
}
```

`loadAd` はメインスレッドで呼びます。画面を破棄するときは、`destroy` で `AdView` を解放します。

:::message alert
テスト中は、必ずテスト用の広告 ID を使います。自分の本番広告を自分でクリックすると、無効なトラフィックとしてポリシー違反になります。
:::

## AdMob にアプリと広告ユニットを登録する

本番の広告を配信するには、[AdMob](https://admob.google.com) でアプリと広告ユニットを登録します。

1. AdMob アカウントを作成します。
2. アプリを追加します。アプリ ID が発行されます。
3. バナーの広告ユニットを作成します。広告ユニット ID が発行されます。
4. アプリ ID を AndroidManifest、広告ユニット ID をコードに、本番の値として設定します。

## Play Console で宣言する

広告を含むアプリは、Play Console で宣言します。

- 「アプリのコンテンツ（App content）」の「広告（Ads）」で、広告の有無を申告します。広告ありの場合は「広告を含む」ラベルが付きます[^ads-label]。
- 広告 ID を使うため、「データセーフティ（Data safety）」で「Device or other IDs（デバイスまたはその他の ID）」の収集・共有を申告します。
- `AD_ID` 権限は Google Mobile Ads SDK が自動で宣言します。Android 13（API 33）以上を対象にし、広告 ID を使うアプリで必要です[^adid]。

[^ads-label]: 広告の申告は [「広告を含む」ラベル](https://support.google.com/googleplay/android-developer/answer/9859496) を参照してください。
[^adid]: 広告 ID の権限は [広告 ID](https://support.google.com/googleplay/android-developer/answer/6048248) を参照してください。

## 広告ポリシーに従う

広告の配置と運用には、ポリシーがあります[^ad-policy]。主な点は次のとおりです。

- 自分の広告を自分でクリックしない。
- 操作ボタンの近くに広告を置くなど、誤クリックを誘う配置をしない。
- 広告をコンテンツに見せかけない。

[^ad-policy]: 広告ポリシーは [AdMob プログラム ポリシー](https://support.google.com/admob/answer/6128543) と [Play の広告に関するポリシー](https://support.google.com/googleplay/android-developer/answer/9857753) を参照してください。

## 確認

- テスト用の広告 ID で、バナー広告がアプリに表示される。
- Play Console で、広告の有無と広告 ID の利用を申告している。
