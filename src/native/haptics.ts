/** A short vibration for answers and taps (ADR-036). Silently does nothing where unsupported. */
import { Capacitor } from "@capacitor/core";
import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";

export function haptic(kind: "ok" | "bad" | "tap"): void {
  if (!Capacitor.isNativePlatform()) return;
  if (kind === "tap") Haptics.impact({ style: ImpactStyle.Light }).catch(() => undefined);
  else Haptics.notification({ type: kind === "ok" ? NotificationType.Success : NotificationType.Error }).catch(() => undefined);
}
