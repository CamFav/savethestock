type ReadonlyNoticeProps = {
  message?: string;
};

export function ReadonlyNotice({
  message = "Vous pouvez consulter ces informations, mais pas les modifier.",
}: ReadonlyNoticeProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
      {message}
    </div>
  );
}
