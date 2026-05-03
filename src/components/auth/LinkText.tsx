interface LinkTextProps {
  text: string;
  onClick?: () => void;
  href?: string;
  className?: string;
}

export function LinkText({ text, onClick, href, className }: LinkTextProps) {
  const Element = href ? 'a' : 'button';
  
  return (
    <Element
      onClick={onClick}
      href={href}
      className={`text-sm font-medium text-green-500 hover:text-green-400 transition-colors ${className || ''}`}
    >
      {text}
    </Element>
  );
}
