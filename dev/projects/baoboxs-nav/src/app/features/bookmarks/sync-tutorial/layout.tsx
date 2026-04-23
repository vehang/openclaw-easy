export default function SyncTutorialLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full mx-auto py-6 px-2">
      {children}
    </div>
  );
}