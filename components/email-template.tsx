interface EmailTemplateProps {
  name: string;
  url: string;
}

export function EmailTemplate({ name, url }: EmailTemplateProps) {
  return (
    <>
      <h2>Verifica tu cuenta {name}</h2>
      <p>Haz clic en el enlace para verificar tu correo:</p>
      <a href={url}>Verificar correo</a>
      <p>El enlace expira en 1 hora.</p>
    </>
  );
}
