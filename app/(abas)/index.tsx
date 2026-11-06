import { EmBreve } from '@/components/EmBreve';
import { PopupMetaDiaria } from '@/components/PopupMetaDiaria';
import { usePerfil } from '@/hooks/usePerfil';

// Aba Estudar (tela inicial). O cronômetro chega na Etapa 3.
// Aqui também aparece, uma única vez, o pop-up da meta diária (PRD 1.4).
export default function AbaEstudar() {
  const { perfil, responderPopupMeta } = usePerfil();

  const mostrarPopup = perfil !== null && perfil.meta_escolhida_em === null;

  return (
    <>
      <EmBreve titulo="Estudar" />
      <PopupMetaDiaria visivel={mostrarPopup} aoResponder={responderPopupMeta} />
    </>
  );
}
