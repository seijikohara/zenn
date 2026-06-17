---
title: "アプリ内購入を実装する"
---

本章では、Google Play Billing[^billing] を使って、単発のアプリ内購入（デジタル商品の都度販売）を実装する最小の手順を扱います。販売には決済プロファイルが必要です。決済プロファイルは「有料アプリとして販売する」章を参照してください。

[^billing]: Play Billing の統合は [Play Billing ライブラリを統合する](https://developer.android.com/google/play/billing/integrate) を参照してください。

:::message
本章のコードは要点を示す最小の骨格です。実際のアプリでは、エラー処理・状態管理・サーバー連携を加えます。完全な実装は公式ドキュメントを参照してください。
:::

## 依存を追加する

Play Billing Library を追加します。執筆時点の最新版は 9.0.0 です。

```kotlin:app/build.gradle.kts
dependencies {
    implementation("com.android.billingclient:billing:9.0.0")
}
```

:::message
2026 年 8 月 31 日までに、新規アプリとアプリ更新は Billing Library 8 以降を使う必要があります[^deprecation]。
:::

[^deprecation]: バージョン要件は [Play Billing の非推奨に関する FAQ](https://developer.android.com/google/play/billing/deprecation-faq) を参照してください。

## Play Console で商品を登録する

Play Console で、販売する単発商品を登録します。

1. 対象アプリの「収益化（Monetize with Play）」から、単発商品（one-time product）を作成します。
2. 商品 ID・タイトル・価格を設定し、商品を有効化します。
3. コードで指定する商品 ID と、Play Console の商品 ID を一致させます。

## BillingClient を初期化する

`BillingClient` を作成し、Google Play へ接続します。`BillingClient` は、画面のクラス（`MainActivity` など）か、課金を扱う専用のクラスに保持します。本章のコード片は、同じクラスのメンバーとして配置します。`context` には、アプリの `Context`（`Activity` または `Application`）を渡します。コードは、`com.android.billingclient.api` のクラスを `import` して使います。

```kotlin
private val purchasesUpdatedListener = PurchasesUpdatedListener { billingResult, purchases ->
    if (billingResult.responseCode == BillingResponseCode.OK && purchases != null) {
        for (purchase in purchases) {
            handlePurchase(purchase)
        }
    }
}

private val billingClient = BillingClient.newBuilder(context)
    .setListener(purchasesUpdatedListener)
    .enablePendingPurchases(
        PendingPurchasesParams.newBuilder()
            .enableOneTimeProducts()
            .build()
    )
    .enableAutoServiceReconnection()
    .build()

billingClient.startConnection(object : BillingClientStateListener {
    override fun onBillingSetupFinished(billingResult: BillingResult) {
        // 準備完了。商品情報の取得や購入の復元を行う
    }

    override fun onBillingServiceDisconnected() {
    }
})
```

## 商品情報を取得する

`queryProductDetailsAsync` で商品情報を取得します。単発商品は `ProductType.INAPP` を指定します。

```kotlin
val params = QueryProductDetailsParams.newBuilder()
    .setProductList(
        listOf(
            QueryProductDetailsParams.Product.newBuilder()
                .setProductId("product_id_example")
                .setProductType(BillingClient.ProductType.INAPP)
                .build()
        )
    )
    .build()

billingClient.queryProductDetailsAsync(params) { billingResult, result ->
    if (billingResult.responseCode == BillingResponseCode.OK) {
        for (productDetails in result.productDetailsList) {
            // 取得した商品情報を画面に表示する
        }
    }
}
```

## 購入フローを起動する

`launchBillingFlow` で購入フローを起動します。購入ダイアログを画面に表示するため、`activity` には、購入を呼び出す `Activity` を渡します。単発商品も、価格などの購入条件をオファーとして持つため、`offerToken` を指定します。

```kotlin
val offerToken = productDetails.oneTimePurchaseOfferDetailsList?.first()?.offerToken ?: return
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

## 購入を確認する

購入後は、3 日以内に購入を確認します。確認しないと、購入が自動で返金され、付与した権利が取り消されます[^ack]。消費型の商品は `consumeAsync` で消費し、再購入できるようにします。非消費型の商品は `acknowledgePurchase` で確認します。

[^ack]: 購入の確認と消費は [Play Billing ライブラリを統合する](https://developer.android.com/google/play/billing/integrate) を参照してください。

次のコードは、非消費型の商品を確認する例です。

```kotlin
fun handlePurchase(purchase: Purchase) {
    if (purchase.purchaseState != Purchase.PurchaseState.PURCHASED) return
    if (!purchase.isAcknowledged) {
        val params = AcknowledgePurchaseParams.newBuilder()
            .setPurchaseToken(purchase.purchaseToken)
            .build()
        billingClient.acknowledgePurchase(params) { }
    }
}
```

消費型の商品では、`acknowledgePurchase` の代わりに `consumeAsync` を呼びます。`consumeAsync` は確認も兼ね、同じ商品を再購入できるようにします。

```kotlin
val consumeParams = ConsumeParams.newBuilder()
    .setPurchaseToken(purchase.purchaseToken)
    .build()
billingClient.consumeAsync(consumeParams) { _, _ -> }
```

## サーバーで検証する

権利の付与は、クライアントだけで判断しません。クライアントは改ざんされる恐れがあり、通信が途切れると購入を取りこぼす場合もあります[^security]。`purchaseToken` をサーバーへ送り、Google Play Developer API の `Purchases.products:get` で正当性を確認してから、権利を付与します。

[^security]: 購入の検証は [購入を検証する](https://developer.android.com/google/play/billing/security) を参照してください。

## テストする

Play Console でライセンステスターを登録すると、実際の課金なしで購入をテストできます[^test]。ライセンステスターは、配信トラックのテスター（「テストとテスター運用」章）とは別に、課金検証用として登録します。テスト用の支払い方法（常に承認・常に拒否など）も使えます。

[^test]: テストは [Play Billing の統合をテストする](https://developer.android.com/google/play/billing/test) を参照してください。

## 確認

- Play Console で単発商品を登録し、有効化している。
- ライセンステスターで購入フローをテストできる。
- 購入後に、確認（acknowledge）または消費（consume）を行っている。
