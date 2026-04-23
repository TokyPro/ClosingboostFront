interface ErrorBannerProps {
  message: string;
}

export function ErrorBanner({ message }: ErrorBannerProps) {
  return (
    <div className="flex items-center gap-3 px-5 py-3.5 bg-error-container text-on-error-container rounded-2xl mb-6">
      <span className="material-symbols-outlined text-[20px] shrink-0">error</span>
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}
