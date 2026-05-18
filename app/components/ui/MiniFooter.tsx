import { FooterLink } from './FooterLink';

const ALL_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/privacy', label: 'Privacy' },
  { href: '/terms', label: 'Terms' },
  { href: '/contact', label: 'Contact' },
];

export function MiniFooter({ exclude }: { exclude?: string }) {
  const links = exclude ? ALL_LINKS.filter(l => l.href !== exclude) : ALL_LINKS;
  return (
    <footer
      className="border-t px-6 py-8 text-center"
      style={{ borderColor: 'var(--color-border-muted)' }}
    >
      <div className="flex justify-center gap-6">
        {links.map(l => (
          <FooterLink key={l.href} href={l.href}>
            {l.label}
          </FooterLink>
        ))}
      </div>
    </footer>
  );
}
