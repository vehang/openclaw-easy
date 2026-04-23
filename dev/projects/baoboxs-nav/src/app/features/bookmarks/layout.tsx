export default function BookmarksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full"> {/* 移除 mx-auto py-6 px-2，只保留 w-full */}
      {children}
    </div>
  );
}