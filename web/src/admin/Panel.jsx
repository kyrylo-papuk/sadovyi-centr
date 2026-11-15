import { useEffect } from "react";

// Повноекранна панель із кнопкою «Назад»: картка замовлення, редактор рослини
export default function Panel({ title, onBack, children, footer }) {
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
