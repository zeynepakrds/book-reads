// Her sayfa geçişinde içerik yumuşakça belirir (CSS animasyonu, JS beklemez).
export default function SiteTemplate({ children }: { children: React.ReactNode }) {
  return <div className="page-in">{children}</div>;
}
