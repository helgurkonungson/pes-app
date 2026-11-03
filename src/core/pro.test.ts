import { describe, expect, it } from "vitest";
import { isoDays, kindOf, manageSubscriptionUrl, proStatus, shouldOfferPro, type StorePackage, toPlans, trialDays, usageView } from "./pro";

const pkg = (id: string, type: string, price: number, extra: Partial<StorePackage["product"]> = {}): StorePackage => ({
  identifier: id,
  packageType: type,
  product: { identifier: `${id}_sku`, priceString: `$${price}`, price, currencyCode: "USD", ...extra },
});

describe("Pro paywall (ADR-037)", () => {
  it("reads ISO periods and trials", () => {
    expect(isoDays("P1W")).toBe(7);
    expect(isoDays("P3D")).toBe(3);
    expect(isoDays("P1M")).toBe(30);
    expect(isoDays("P1Y")).toBe(365);
    expect(isoDays("")).toBeNull();
    expect(isoDays("1W")).toBeNull();
    expect(trialDays(pkg("m", "MONTHLY", 4.99, { defaultOption: { freePhase: { billingPeriod: { iso8601: "P1W" } } } }))).toBe(7);
    expect(trialDays(pkg("m", "MONTHLY", 4.99, { introPrice: { price: 0, periodNumberOfUnits: 3, periodUnit: "DAY" } }))).toBe(3);
    expect(trialDays(pkg("m", "MONTHLY", 4.99, { introPrice: { price: 0.99, periodNumberOfUnits: 1, periodUnit: "MONTH" } }))).toBeNull();
  });

  it("orders plans annual first and computes the saving", () => {
    const plans = toPlans([pkg("$rc_monthly", "MONTHLY", 4.99), pkg("$rc_annual", "ANNUAL", 39.99, { pricePerMonthString: "$3.33" }), pkg("x", "CUSTOM", 1)]);
    expect(plans.map((p) => p.kind)).toEqual(["annual", "monthly", "other"]);
    expect(plans[0]).toMatchObject({ price: "$39.99", perMonth: "$3.33", savePct: 33 });
    expect(plans[1].savePct).toBeNull();
    expect(kindOf(pkg("y", "CUSTOM", 1, { subscriptionPeriod: "P1Y" }))).toBe("annual");
    // different currencies: no saving claimed
    expect(toPlans([pkg("m", "MONTHLY", 4.99), pkg("a", "ANNUAL", 39.99, { currencyCode: "EUR" })])[0].savePct).toBeNull();
  });

  it("reads the entitlement", () => {
    expect(proStatus(null).active).toBe(false);
    expect(proStatus({ entitlements: { active: {} } }).active).toBe(false);
    expect(proStatus({ entitlements: { active: { pro: { expirationDate: "2026-11-05T00:00:00Z", periodType: "TRIAL", willRenew: true } } } })).toEqual({
      active: true,
      until: "2026-11-05T00:00:00Z",
      willRenew: true,
      trial: true,
    });
  });

  it("shows the daily allowance", () => {
    expect(usageView({ limit: 600_000, used: 150_000, left: 450_000, resetAt: "x" })).toEqual({ ratio: 0.25, lessonsLeft: 7 });
    expect(usageView({ limit: 600_000, used: 700_000, left: 0, resetAt: "x" })).toEqual({ ratio: 1, lessonsLeft: 0 });
    expect(usageView(null)).toBeNull();
  });

  it("links to the Play subscription page", () => {
    expect(manageSubscriptionUrl("io.github.helgurkonungson.pes", "pro_monthly")).toBe(
      "https://play.google.com/store/account/subscriptions?package=io.github.helgurkonungson.pes&sku=pro_monthly",
    );
  });
});

describe("Pro offer after a lesson (1.1.0)", () => {
  const now = new Date("2026-11-10T12:00:00Z");
  const base = { purchasable: true, proActive: false, graded: true, now };
  it("shows after a checked open answer, at most once a week", () => {
    expect(shouldOfferPro(base)).toBe(true);
    expect(shouldOfferPro({ ...base, lastOffer: "2026-11-05T12:00:00Z" })).toBe(false);
    expect(shouldOfferPro({ ...base, lastOffer: "2026-11-03T12:00:00Z" })).toBe(true);
    expect(shouldOfferPro({ ...base, lastOffer: "garbage" })).toBe(true);
  });
  it("never to Pro users, without a checked answer, or where Pro isn't sold", () => {
    expect(shouldOfferPro({ ...base, proActive: true })).toBe(false);
    expect(shouldOfferPro({ ...base, provider: "chompbook" })).toBe(false);
    expect(shouldOfferPro({ ...base, graded: false })).toBe(false);
    expect(shouldOfferPro({ ...base, purchasable: false })).toBe(false);
  });
});
