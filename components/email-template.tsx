interface EmailTemplateProps {
  name: string;
  url: string;
}

export function EmailTemplate({ name, url }: EmailTemplateProps) {
  return (
    <>
      <h2 className="text-xl">Verifica tu cuenta {name}</h2>
      <p className="text-sm">Haz clic en el enlace para verificar tu correo:</p>
      <a className="hover:scale-105" href={url}>
        Verificar correo
      </a>
      <p>
        El enlace expira en{" "}
        <strong className="font-bold text-red-500">1 hora</strong>.
      </p>
    </>
  );
}
