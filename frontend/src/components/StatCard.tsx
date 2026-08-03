type StatCardProps = {
  title: string;
  value: string;
  description?: string;
  color?: "blue" | "green" | "red" | "orange";
};

const colorClasses = {
  blue: "border-l-blue-700",
  green: "border-l-emerald-600",
  red: "border-l-red-600",
  orange: "border-l-orange-600",
};

function StatCard({
  title,
  value,
  description,
  color = "blue",
}: StatCardProps) {
  return (
    <div
      className={`rounded-xl border border-slate-200 border-l-4 bg-white p-5 shadow-sm ${colorClasses[color]}`}
    >
      <p className="text-sm font-semibold text-slate-500">{title}</p>
      <p className="mt-2 text-3xl font-bold text-slate-950">{value}</p>
      {description && <p className="mt-2 text-xs text-slate-500">{description}</p>}
    </div>
  );
}

export default StatCard;
