"use client";

import { useEffect, useMemo, useState } from "react";
import type { SanityRecipe } from "@/types/page";

type IngredientItem = NonNullable<SanityRecipe["ingrediens"]>[number];

type Props = {
  recipeId: string;
  ingredients: IngredientItem[];
  compact?: boolean;
};

const formatMeasurement = (item: IngredientItem) => {
  if (item.mengde) {
    return item.mengde;
  }
  const quantity = item.measurement?.unitQuantity;
  const unit = item.measurement?.unit;
  if (typeof quantity === "number" && unit) {
    return `${quantity} ${unit}`;
  }
  if (typeof quantity === "number") {
    return `${quantity}`;
  }
  if (unit) {
    return unit;
  }
  return "";
};

export const IngredientChecklist = ({ recipeId, ingredients, compact = false }: Props) => {
  const storageKey = useMemo(() => `mealplaner:ingredient-checks:${recipeId}`, [recipeId]);
  const [shoppingMode, setShoppingMode] = useState(false);
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) {
        return;
      }
      const parsed = JSON.parse(raw) as Record<string, boolean>;
      setChecked(parsed);
    } catch {
      setChecked({});
    }
  }, [storageKey]);

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(checked));
    } catch {
      // ignore localStorage errors
    }
  }, [checked, storageKey]);

  const toggleIngredient = (id: string) => {
    setChecked((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const resetChecklist = () => setChecked({});
  const checkedCount = ingredients.reduce((sum, item, index) => {
    const id = item._key || `${item.name || "ingredient"}-${index}`;
    return sum + (checked[id] ? 1 : 0);
  }, 0);

  if (ingredients.length === 0) {
    return <p className="text-sm text-muted-foreground">Ingen ingredienser lagt til ennå.</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setShoppingMode((value) => !value)}
          className={`inline-flex min-h-11 items-center justify-center border px-3 py-2 text-sm font-semibold tracking-[0.02em] transition-colors ${
            shoppingMode
              ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-800"
              : "border-border/70 bg-background/85 text-foreground hover:bg-muted/40"
          } ${compact ? "w-full" : ""}`}
          aria-pressed={shoppingMode}
        >
          Handleliste modus: {shoppingMode ? "Pa" : "Av"}
        </button>
        {shoppingMode ? (
          <button
            type="button"
            onClick={resetChecklist}
            className={`inline-flex min-h-11 items-center justify-center border border-border/70 bg-background/85 px-3 py-2 text-sm font-semibold tracking-[0.02em] text-foreground transition-colors hover:bg-muted/40 ${
              compact ? "w-full" : ""
            }`}
          >
            Nullstill
          </button>
        ) : null}
      </div>

      {shoppingMode ? (
        <p className="text-xs text-muted-foreground md:text-sm">
          Huk av det du har handlet: {checkedCount}/{ingredients.length}
        </p>
      ) : (
        <p className="text-xs text-muted-foreground md:text-sm">Skru pa handleliste modus for a huke av varer.</p>
      )}

      <ul className={compact ? "space-y-1.5" : "space-y-1.5 md:space-y-2"}>
        {ingredients.map((item, index) => {
          const id = item._key || `${item.name || "ingredient"}-${index}`;
          const isChecked = Boolean(checked[id]);
          return (
            <li
              key={id}
              className={`border-b border-border/35 ${compact ? "text-sm" : "text-sm md:text-base"} last:border-b-0`}
            >
              <button
                type="button"
                onClick={() => (shoppingMode ? toggleIngredient(id) : undefined)}
                className={`grid w-full grid-cols-[1fr_auto] items-start gap-3 py-2 text-left ${
                  shoppingMode ? "cursor-pointer active:opacity-80" : "cursor-default"
                }`}
                aria-pressed={isChecked}
                aria-label={shoppingMode ? `Marker ${item.name || "ingrediens"} som handlet` : undefined}
              >
                <span className="flex items-start gap-2.5">
                  {shoppingMode ? (
                    <span
                      aria-hidden
                      className={`mt-0.5 inline-flex h-5.5 w-5.5 items-center justify-center border ${
                        isChecked
                          ? "border-emerald-500 bg-emerald-500/15 text-[13px] font-bold leading-none text-emerald-800"
                          : "border-border/80 text-[13px] font-bold leading-none text-muted-foreground/70"
                      }`}
                    >
                      {isChecked ? "X" : ""}
                    </span>
                  ) : null}
                  <span className={`pr-2 font-medium ${isChecked ? "text-muted-foreground line-through" : ""}`}>
                    {item.name || "Ukjent ingrediens"}
                  </span>
                </span>
                <span className={`text-right text-muted-foreground ${isChecked ? "line-through" : ""}`}>
                  {formatMeasurement(item)}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
