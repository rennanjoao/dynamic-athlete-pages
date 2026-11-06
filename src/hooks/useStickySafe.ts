import { useEffect } from "react";

/**
 * Liga o modo "sticky-safe" no <html> enquanto `active` for true.
 *
 * Por quê: index.css usa `overflow-x: hidden` em html/body/#root para não ter rolagem horizontal.
 * Só que `overflow-x: hidden` transforma esses elementos em CONTÊINER DE ROLAGEM e isso desliga
 * `position: sticky` de tudo que está dentro (a barra "Macros do dia vs meta" rolava junto com a página).
 * Com a classe `sticky-safe`, index.css troca por `overflow-x: clip`, que corta igual, mas não cria
 * contêiner de rolagem — então o sticky volta a funcionar. Só é ligado nas telas que precisam.
 *
 * Usa contador: várias telas podem ligar ao mesmo tempo sem uma desligar a outra.
 */
const CLASS_NAME = "sticky-safe";
let users = 0;

export function useStickySafe(active: boolean = true): void {
  useEffect(() => {
    if (!active || typeof document === "undefined") return;
    users += 1;
    document.documentElement.classList.add(CLASS_NAME);
    return () => {
      users = Math.max(0, users - 1);
      if (users === 0) document.documentElement.classList.remove(CLASS_NAME);
    };
  }, [active]);
}
