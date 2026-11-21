/**
 * The bookworm mascot and the drawn icons (2.0.0). Pure decoration: always `alt=""` and hidden from
 * screen readers — the text next to it says what is going on.
 */
import { ART, type ArtName } from "../assets/art";

/** A drawn illustration, `size` px wide (height from its proportions). `float` makes it bob gently. */
export function Mascot({ name, size = 160, float, className }: { name: ArtName; size?: number; float?: boolean; className?: string }) {
  return (
    <img
      src={ART[name]}
      alt=""
      aria-hidden
      draggable={false}
      decoding="async"
      className={`mascot${float ? " float" : ""}${className ? ` ${className}` : ""}`}
      style={{ width: size }}
      data-art={name}
    />
  );
}

export type IconArt = "energy" | "streak" | "freeze" | "rest" | "skip";

/** A small drawn icon in place of a line icon: energy, streak, freeze, rest day, skip. */
export function ArtIcon({ name, size = 18, off, className }: { name: IconArt; size?: number; off?: boolean; className?: string }) {
  return (
    <img
      src={ART[`icon-${name}`]}
      alt=""
      aria-hidden
      draggable={false}
      className={`art-icon${off ? " off" : ""}${className ? ` ${className}` : ""}`}
      style={{ width: size, height: size }}
    />
  );
}
