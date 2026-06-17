---
title: "定期購入（サブスク）を実装する"
---

本章では、Google Play Billing を使って、定期購入（サブスクリプション）を実装する最小の手順を扱います。アプリ内購入の基本は「アプリ内購入を実装する」章を前提とします。

:::message
本章のコードは要点を示す最小の骨格です。実際のアプリでは、エラー処理・状態管理・サーバー連携を加えます。完全な実装は公式ドキュメントを参照してください。
:::

## サブスクの商品モデル

サブスクは、商品（subscription）・基本プラン（base plan）・オファー（offer）の 3 階層で構成します[^subs]。

| 階層 | 役割 |
| ------ | ------ |
| 商品（subscription） | ユーザーに権利を付与する単位です。 |
| 基本プラン（base plan） | 課金の構成です。1 つの商品に、月額や年額など複数の基本プランを持てます。 |
| オファー（offer） | 無料トライアルや割引など、基本プランの販促のバリエーションです。 |

基本プランには、自動更新（auto-renewing）と前払い（prepaid）があります。各オファーは `offerToken` を持ちます。

[^subs]: サブスクの構成は [サブスクリプションについて](https://developer.android.com/google/play/billing/subscriptions) を参照してください。

## Play Console で登録する

Play Console の「収益化（Monetize with Play）」で、サブスク商品を登録します[^console]。

1. サブスク商品を作成します。
2. 商品に基本プランを追加します。
3. 必要に応じてオファーを追加します。
4. 各要素を有効化します。有効化すると、アプリから取得できます。

[^console]: 登録手順は [定期購入を作成・管理する](https://support.google.com/googleplay/android-developer/answer/140504) を参照してください。

## 商品情報を取得する

`queryProductDetailsAsync` で `ProductType.SUBS` を指定し、オファーの `offerToken` を取得します。

:::message
`billingClient` の初期化は「アプリ内購入を実装する」章と同じです。`billingClient` は、画面のクラス（`MainActivity` など）か、課金を扱う専用のクラスに保持します。本章のコードは、`com.android.billingclient.api` のクラスを `import` して使います。
:::

```kotlin
val params = QueryProductDetailsParams.newBuilder()
    .setProductList(
        listOf(
            QueryProductDetailsParams.Product.newBuilder()
                .setProductId("premium")
                .setProductType(BillingClient.ProductType.SUBS)
                .build()
        )
    )
    .build()

billingClient.queryProductDetailsAsync(params) { billingResult, result ->
    if (billingResult.responseCode == BillingResponseCode.OK) {
        for (productDetails in result.productDetailsList) {
            val offers = productDetails.subscriptionOfferDetails ?: continue
            val offerToken = offers.first().offerToken
            // offerToken を購入フローで使う
        }
    }
}
```

## 購入フローを起動して確認する

購入フローには、選んだオファーの `offerToken` を渡します。`activity` には、購入を呼び出す `Activity` を渡します。

```kotlin
val flowParams = BillingFlowParams.newBuilder()
    .setProductDetailsParamsList(
        listOf(
            BillingFlowParams.ProductDetailsParams.newBuilder()
                .setProductDetails(productDetails)
                .setOfferToken(offerToken)
                .build()
        )
    )
    .build()

billingClient.launchBillingFlow(activity, flowParams)
```

購入後は、3 日以内に `acknowledgePurchase` で確認します。確認の実装は「アプリ内購入を実装する」章と同じです。

:::message alert
サブスクは消費しません。`consumeAsync` は単発の消費型商品のみで使います。
:::

## サーバーで検証し、通知を受け取る

サブスクの状態は、サーバーで管理します[^security]。

1. `purchaseToken` をサーバーへ送ります。
2. Google Play Developer API の `Purchases.subscriptionsv2:get` で状態を確認します。

あわせて、Real-time Developer Notifications（リアルタイムデベロッパー通知、RTDN）を設定すると、更新・解約・猶予期間入りなどの状態変化を Cloud Pub/Sub で受け取れます。RTDN は状態変化の通知のみを送るため、受信後に Developer API で完全な状態を取得します。

[^security]: 検証と通知は [購入を検証する](https://developer.android.com/google/play/billing/security) と [リアルタイムデベロッパー通知](https://developer.android.com/google/play/billing/rtdn-reference) を参照してください。

## ライフサイクルを扱う

サブスクには、次の状態があります[^lifecycle]。

| 状態 | 説明 |
| ------ | ------ |
| 猶予期間（grace period） | 支払いに失敗した後の回復期間です。ユーザーはアクセスを維持します。 |
| アカウントの一時停止（account hold） | 猶予期間の後の回復期間です。ユーザーはアクセスを失います。 |
| 一時停止（pause） | ユーザーが配信を一定期間止める機能です。 |

価格変更では、値下げは自動で適用されます。値上げは、ユーザーの同意を要する場合があります。

[^lifecycle]: 状態の詳細は [サブスクリプションのライフサイクル](https://developer.android.com/google/play/billing/lifecycle/subscriptions) を参照してください。

## サブスクのポリシーに従う

サブスクには、固有のポリシーがあります[^policy]。

- 価格・課金周期・自動更新の条件を明確に開示します。
- 解約の導線をアプリ内に用意します。
- 無料トライアルを提供する場合は、終了後の課金額を明示します。

[^policy]: サブスクのポリシーは [定期購入のポリシー](https://support.google.com/googleplay/android-developer/answer/9900533) を参照してください。

## テストする

ライセンステスターでサブスクをテストします[^test]。

:::message
テスト時は更新の周期が短縮され、最大 6 回まで更新した後に自動で解約します。猶予期間や一時停止などの期間も短縮されます。
:::

[^test]: テストは [Play Billing の統合をテストする](https://developer.android.com/google/play/billing/test) を参照してください。

## 確認

- Play Console でサブスク商品・基本プラン・オファーを登録し、有効化している。
- ライセンステスターでサブスクの購入と更新をテストできる。
- サーバーでサブスクの状態を検証し、RTDN を設定している。
