import { useEffect } from "react";
import type { ReactNode } from "react";

interface PanelProps {
  title: string;
  onBack: () => void;
  children: ReactNode;
  /** кнопки внизу екрана (наприклад «Зберегти») */
  footer?: ReactNode;
}

// Повноекранна панель із кнопкою «Назад»: картка замовлення, редактор рослини
export default function Panel({ title, onBack, children, footer }: PanelProps) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <>
      <div className="panel" role="dialog" aria-modal="true" aria-label={title}>
        <div className="panel-bar">
          <div className="wrap">
            <button className="back" type="button" onClick={onBack}>← Назад</button>
            <b>{title}</b>
          </div>
        </div>
        <div className="wrap panel-body">{children}</div>
      </div>
      {footer && <div className="savebar"><div className="wrap">{footer}</div></div>}
    </>
  );
}
