"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import { Eye, X } from "lucide-react";

export type PreviewExplanationKey =
  | "rpm"
  | "gross-revenue"
  | "fuel-surcharge"
  | "fuel-surcharge-included"
  | "trip-number"
  | "load-id"
  | "calculator-field"
  | "analyze-load"
  | "save-load"
  | "load-history"
  | "ifta-estimate"
  | "fuel-price"
  | "mpg"
  | "operator-identity"
  | "billing-command"
  | "subscription-tile"
  | "stripe-checkout"
  | "stripe-portal"
  | "account-email"
  | "account-password"
  | "logout"
  | "overhead-item"
  | "overhead-delete"
  | "vehicle-profile"
  | "pay-template"
  | "lane-template-load"
  | "lane-template-delete"
  | "support-ticket"
  | "history-report"
  | "settings-station";

type PreviewExplanation = {
  title: string;
  body: string;
  unlock: string;
};

const PREVIEW_EXPLANATIONS = {
  rpm: {
    title: "RPM Input",
    body: "RPM is the rate per loaded mile. In live use, Karpilo LoadIQ compares RPM against loaded miles, deadhead, fuel, overhead, and target true RPM to show whether a load can support the truck.",
    unlock: "Gold, Pilot, Legacy Launch, or Platinum access unlocks live load analysis.",
  },
  "gross-revenue": {
    title: "Gross Revenue Input",
    body: "Gross revenue lets you enter the total linehaul package when you do not know RPM yet. The app can derive RPM from gross revenue and loaded miles.",
    unlock: "Live analysis is protected so preview users can inspect the field without running production calculations.",
  },
  "fuel-surcharge": {
    title: "Fuel Surcharge",
    body: "Fuel surcharge is tracked separately from linehaul so fuel recovery does not distort true RPM, gross revenue, or fuel pressure.",
    unlock: "Live calculations use this value once the account has active access.",
  },
  "fuel-surcharge-included": {
    title: "FSC Included In Gross",
    body: "When FSC is already included in gross revenue, Karpilo LoadIQ subtracts it before deriving linehaul RPM. This prevents fuel surcharge from being counted twice.",
    unlock: "Live gross-to-RPM handling is available with active subscription access.",
  },
  "trip-number": {
    title: "Trip Number",
    body: "Trip Number is the driver-facing broker, dispatcher, carrier, customer, or rate-con reference. If left blank in live use, the saved load can receive an AUTO trip number while Load ID remains the system identifier.",
    unlock: "Saving creates the protected Load ID and stores the Trip Number in load history.",
  },
  "load-id": {
    title: "Load ID",
    body: "Load ID is the system-generated Karpilo LoadIQ identifier created when a load is saved. It is separate from a broker, dispatcher, carrier, or customer trip number.",
    unlock: "Preview blocks saving, so no production Load ID is created.",
  },
  "calculator-field": {
    title: "Calculator Field",
    body: "Calculator fields collect route, revenue, miles, fuel, equipment, time, and expense assumptions. In live mode, those values feed the profitability engine.",
    unlock: "Preview mode explains the field and blocks typing so no production input or usage event is created.",
  },
  "analyze-load": {
    title: "Analyze Load",
    body: "Analyze runs the freight profitability engine using route, revenue, fuel, overhead, reserves, and profile assumptions. Preview mode blocks execution so no usage or production records are created.",
    unlock: "Activate Gold, Pilot, Legacy Launch, or Platinum access to run real analyses.",
  },
  "save-load": {
    title: "Save Load",
    body: "Saving writes the analyzed load to Supabase, assigns the protected Load ID, keeps the Trip Number, and makes the load available in history and reports.",
    unlock: "Active subscription access is required before preview can save production load history.",
  },
  "load-history": {
    title: "Load History",
    body: "Load history lists saved loads by Load ID, Trip Number, pickup, delivery, margin, RPM, and decision context so operators can compare freight after the fact.",
    unlock: "Preview shows the structure but blocks opening production records and reports.",
  },
  "ifta-estimate": {
    title: "IFTA Estimation",
    body: "Platinum IFTA support is planned as estimation and planning assistance using jurisdiction miles, gallons, fuel purchases, and route context. It is not tax filing or jurisdictional certification.",
    unlock: "Platinum is planned as the future premium intelligence layer.",
  },
  "fuel-price": {
    title: "Fuel Price",
    body: "Fuel price drives fuel-cost pressure and true RPM. Live mode can use the EIA national diesel average or a user override when actual pump price is known.",
    unlock: "Preview blocks typing and does not write fuel assumptions to a user profile.",
  },
  mpg: {
    title: "MPG Assumption",
    body: "MPG controls estimated fuel gallons and fuel cost for the route. Live users can store vehicle defaults and override per load when conditions change.",
    unlock: "Signed-in settings access stores MPG assumptions per user.",
  },
  "operator-identity": {
    title: "Operator Identity",
    body: "Operator identity ties the account, company, truck profile, and entitlement state together so Karpilo LoadIQ can keep settings and history user-specific.",
    unlock: "Signed-in users can save real identity and company details.",
  },
  "billing-command": {
    title: "Billing Command",
    body: "Billing Command shows entitlement status, payment rail, pricing locks, and subscription support. Preview blocks checkout, portal, and billing mutations.",
    unlock: "Sign in with live access to manage the active subscription.",
  },
  "subscription-tile": {
    title: "Subscription Tile",
    body: "Subscription tiles show the plan, entitlement state, usage limits, pricing locks, and payment rail. They help separate Pilot, Legacy Launch, Gold, and planned Platinum access.",
    unlock: "Preview blocks payment changes and production billing sessions.",
  },
  "stripe-checkout": {
    title: "Stripe Checkout",
    body: "Checkout starts a Stripe subscription and can create or update billing records. Preview mode blocks this production payment action.",
    unlock: "Live checkout opens after sign-in and eligibility checks.",
  },
  "stripe-portal": {
    title: "Stripe Customer Portal",
    body: "The portal manages payment methods, invoices, renewal, and cancellation for Stripe-managed users. Preview blocks portal sessions.",
    unlock: "A live Stripe customer record is required.",
  },
  "account-email": {
    title: "Account Email",
    body: "Email Control updates the Supabase Auth identity after confirmation. Preview lets you inspect the field without changing account state.",
    unlock: "Sign in to update the real account email.",
  },
  "account-password": {
    title: "Password Control",
    body: "Password Control updates the Supabase Auth password for the current account. Preview mode blocks credential changes.",
    unlock: "Sign in with a valid session to update credentials.",
  },
  logout: {
    title: "Session Control",
    body: "Logout ends the current authenticated session. In preview, this exits preview mode instead of touching Supabase Auth.",
    unlock: "Live logout is available after sign-in.",
  },
  "overhead-item": {
    title: "Expense Intelligence",
    body: "Overhead items feed daily fixed cost, CPM exposure, and percent deductions into the calculator. Preview blocks writes to overhead tables.",
    unlock: "Active signed-in settings access stores expense defaults per user.",
  },
  "overhead-delete": {
    title: "Delete Overhead Item",
    body: "Deleting removes a stored recurring cost from the user profile and changes future calculator defaults. Preview blocks destructive changes.",
    unlock: "Signed-in users can manage their own overhead records.",
  },
  "vehicle-profile": {
    title: "Vehicle Intelligence",
    body: "Vehicle settings store MPG, reserve, truck, target income, and operating assumptions used by the calculator.",
    unlock: "Signed-in users can save vehicle and operating assumptions to their Supabase profile.",
  },
  "pay-template": {
    title: "Pay Template",
    body: "Pay templates save reusable percentage, CPM, or flat compensation assumptions. Preview blocks template creation.",
    unlock: "Live template creation is available in authenticated settings.",
  },
  "lane-template-load": {
    title: "Load Lane Template",
    body: "Loading a template pre-fills the calculator with a saved lane model. Preview explains the workflow without loading production data.",
    unlock: "Templates are available after signed-in saved-load workflows.",
  },
  "lane-template-delete": {
    title: "Delete Lane Template",
    body: "Deleting a template removes a saved lane model from Supabase. Preview blocks destructive template actions.",
    unlock: "Signed-in users can delete their own lane templates.",
  },
  "support-ticket": {
    title: "Support Request",
    body: "Support requests create a ticket or product feedback record. Preview blocks sending messages or creating support records.",
    unlock: "Signed-in users can submit real support or feature requests.",
  },
  "history-report": {
    title: "Load Report",
    body: "Reports open printable load intelligence from saved history. Preview blocks report generation against production records.",
    unlock: "Save a real load to view live reports.",
  },
  "settings-station": {
    title: "Command Station",
    body: "Settings stations are real app routes for account, billing, expense, and vehicle controls. Preview allows navigation but blocks writes.",
    unlock: "Sign in to persist user-specific settings.",
  },
} satisfies Record<PreviewExplanationKey, PreviewExplanation>;

const previewExplanationKeys = new Set<PreviewExplanationKey>(
  Object.keys(PREVIEW_EXPLANATIONS) as PreviewExplanationKey[]
);

const interceptSelector = [
  "[data-preview-explain]",
  "input",
  "textarea",
  "select",
  "[contenteditable='true']",
  "button",
  "[role='button']",
  "[role='option']",
  "[aria-haspopup='listbox']",
].join(",");

type PreviewContextValue = {
  enabled: boolean;
  explain: (key: PreviewExplanationKey) => void;
};

const PreviewContext = createContext<PreviewContextValue>({
  enabled: false,
  explain: () => {},
});

export function PreviewModeProvider({
  enabled,
  children,
}: {
  enabled: boolean;
  children: ReactNode;
}) {
  const [activeKey, setActiveKey] = useState<PreviewExplanationKey | null>(null);
  const explain = useCallback((key: PreviewExplanationKey) => {
    setActiveKey(key);
  }, []);
  const value = useMemo(() => ({ enabled, explain }), [enabled, explain]);
  const active = activeKey ? PREVIEW_EXPLANATIONS[activeKey] : null;

  useEffect(() => {
    if (!enabled) return;

    function allowPreviewEvent(target: EventTarget | null) {
      return (
        target instanceof Element &&
        Boolean(target.closest("[data-preview-allow='true']"))
      );
    }

    function getDatasetKey(element: Element | null) {
      const value =
        element instanceof HTMLElement
          ? element.dataset.previewExplain
          : undefined;

      if (value && previewExplanationKeys.has(value as PreviewExplanationKey)) {
        return value as PreviewExplanationKey;
      }

      return null;
    }

    function labelFor(element: Element) {
      const explicitLabel =
        element.getAttribute("aria-label") ??
        element.getAttribute("name") ??
        element.getAttribute("id") ??
        element.getAttribute("placeholder") ??
        "";

      const visibleLabel =
        element instanceof HTMLInputElement ||
        element instanceof HTMLTextAreaElement ||
        element instanceof HTMLSelectElement
          ? element.labels?.[0]?.textContent ?? ""
          : element.textContent ?? "";

      return `${explicitLabel} ${visibleLabel}`.toLowerCase();
    }

    function inferExplanation(element: Element): PreviewExplanationKey {
      const explicit = getDatasetKey(element.closest("[data-preview-explain]"));

      if (explicit) return explicit;

      const label = labelFor(element);

      if (label.includes("trip")) return "trip-number";
      if (label.includes("load id") || label.includes("load #")) return "load-id";
      if (label.includes("rpm") || label.includes("rate per mile")) return "rpm";
      if (label.includes("gross") || label.includes("revenue")) return "gross-revenue";
      if (label.includes("fsc") || label.includes("fuel surcharge")) return "fuel-surcharge";
      if (label.includes("fuel price") || label.includes("diesel")) return "fuel-price";
      if (label.includes("mpg")) return "mpg";
      if (label.includes("ifta")) return "ifta-estimate";
      if (label.includes("billing") || label.includes("subscription")) return "billing-command";
      if (label.includes("checkout")) return "stripe-checkout";
      if (label.includes("portal")) return "stripe-portal";
      if (label.includes("email")) return "account-email";
      if (label.includes("password")) return "account-password";
      if (label.includes("logout") || label.includes("sign out")) return "logout";
      if (label.includes("save load")) return "save-load";
      if (label.includes("save") && label.includes("profile")) return "vehicle-profile";
      if (label.includes("analyze")) return "analyze-load";
      if (label.includes("support") || label.includes("feedback")) return "support-ticket";
      if (label.includes("template") && label.includes("delete")) return "lane-template-delete";
      if (label.includes("template")) return "lane-template-load";
      if (label.includes("delete")) return "overhead-delete";
      if (label.includes("expense") || label.includes("overhead")) return "overhead-item";
      if (label.includes("vehicle") || label.includes("truck")) return "vehicle-profile";
      if (label.includes("operator") || label.includes("company")) return "operator-identity";
      if (label.includes("history") || label.includes("report")) return "load-history";

      if (
        element instanceof HTMLInputElement ||
        element instanceof HTMLTextAreaElement ||
        element instanceof HTMLSelectElement
      ) {
        return "calculator-field";
      }

      return "settings-station";
    }

    function findPreviewTarget(target: EventTarget | null) {
      if (!(target instanceof Element)) return null;
      const navigationLink = target.closest("a[href]");

      if (navigationLink && !getDatasetKey(navigationLink)) {
        return null;
      }

      return target.closest(interceptSelector);
    }

    function blockEvent(event: Event, key: PreviewExplanationKey) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      if (event.target instanceof HTMLElement) {
        event.target.blur();
      }
      setActiveKey(key);
    }

    function handlePointerOrClick(event: Event) {
      if (allowPreviewEvent(event.target)) return;
      const element = findPreviewTarget(event.target);
      if (!element) return;

      blockEvent(event, inferExplanation(element));
    }

    function handleFocus(event: Event) {
      if (allowPreviewEvent(event.target)) return;
      const element = findPreviewTarget(event.target);

      if (
        !element ||
        !(
          element instanceof HTMLInputElement ||
          element instanceof HTMLTextAreaElement ||
          element instanceof HTMLSelectElement ||
          element.getAttribute("contenteditable") === "true"
        )
      ) {
        return;
      }

      blockEvent(event, inferExplanation(element));
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (allowPreviewEvent(event.target)) return;
      const element = findPreviewTarget(event.target);
      if (!element) return;

      if (
        element instanceof HTMLInputElement ||
        element instanceof HTMLTextAreaElement ||
        element instanceof HTMLSelectElement ||
        element.getAttribute("contenteditable") === "true" ||
        event.key === "Enter" ||
        event.key === " "
      ) {
        blockEvent(event, inferExplanation(element));
      }
    }

    function handleSubmit(event: Event) {
      if (allowPreviewEvent(event.target)) return;
      blockEvent(event, "settings-station");
    }

    function handleInputEvent(event: Event) {
      if (allowPreviewEvent(event.target)) return;
      const element = findPreviewTarget(event.target);

      if (
        !element ||
        !(
          element instanceof HTMLInputElement ||
          element instanceof HTMLTextAreaElement ||
          element instanceof HTMLSelectElement ||
          element.getAttribute("contenteditable") === "true"
        )
      ) {
        return;
      }

      blockEvent(event, inferExplanation(element));
    }

    document.addEventListener("pointerdown", handlePointerOrClick, true);
    document.addEventListener("click", handlePointerOrClick, true);
    document.addEventListener("focusin", handleFocus, true);
    document.addEventListener("keydown", handleKeyDown, true);
    document.addEventListener("beforeinput", handleInputEvent, true);
    document.addEventListener("input", handleInputEvent, true);
    document.addEventListener("change", handleInputEvent, true);
    document.addEventListener("submit", handleSubmit, true);

    return () => {
      document.removeEventListener("pointerdown", handlePointerOrClick, true);
      document.removeEventListener("click", handlePointerOrClick, true);
      document.removeEventListener("focusin", handleFocus, true);
      document.removeEventListener("keydown", handleKeyDown, true);
      document.removeEventListener("beforeinput", handleInputEvent, true);
      document.removeEventListener("input", handleInputEvent, true);
      document.removeEventListener("change", handleInputEvent, true);
      document.removeEventListener("submit", handleSubmit, true);
    };
  }, [enabled]);

  return (
    <PreviewContext.Provider value={value}>
      {enabled && <PreviewModeBanner />}
      {children}
      {enabled && active && (
        <div className="fixed inset-0 z-50 flex items-end bg-slate-950/70 px-4 py-5 backdrop-blur-sm">
          <section className="mx-auto w-full max-w-md rounded-2xl border border-sky-400/25 bg-[#08111F] p-5 shadow-[0_0_45px_rgba(56,189,248,0.18)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-sky-300">
                  Preview Explanation
                </p>
                <h2 className="mt-2 text-2xl font-black text-slate-100">
                  {active.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setActiveKey(null)}
                data-preview-allow="true"
                className="rounded-xl border border-slate-700 bg-slate-900 p-2 text-slate-300"
                aria-label="Close preview explanation"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-300">
              {active.body}
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              {active.unlock}
            </p>
            <Link
              href="/auth/login"
              data-preview-allow="true"
              className="mt-5 inline-flex rounded-xl bg-sky-400 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-[#060B14]"
            >
              Sign In For Live Access
            </Link>
          </section>
        </div>
      )}
    </PreviewContext.Provider>
  );
}

export function usePreviewMode() {
  return useContext(PreviewContext);
}

export function PreviewActionButton({
  explanation,
  children,
  className,
}: {
  explanation: PreviewExplanationKey;
  children: ReactNode;
  className: string;
}) {
  const preview = usePreviewMode();

  return (
    <button
      type="button"
      data-preview-explain={explanation}
      onClick={() => preview.explain(explanation)}
      className={className}
    >
      {children}
    </button>
  );
}

function PreviewModeBanner() {
  return (
    <div className="bg-[#060B14] px-4 pt-4 text-slate-100 md:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 rounded-2xl border border-sky-400/25 bg-sky-400/10 p-4 shadow-[0_0_24px_rgba(56,189,248,0.12)] sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Eye className="mt-0.5 h-5 w-5 shrink-0 text-sky-300" aria-hidden="true" />
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-sky-200">
              Preview Mode
            </p>
            <p className="mt-1 text-sm leading-6 text-slate-300">
              You are moving through the real app structure. Writes, billing,
              email sends, saves, exports, and account changes are blocked.
            </p>
          </div>
        </div>
        <Link
          href="/api/preview/exit"
          data-preview-allow="true"
          className="inline-flex justify-center rounded-xl border border-slate-700 bg-[#060B14] px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-slate-200"
        >
          Exit Preview
        </Link>
      </div>
    </div>
  );
}
