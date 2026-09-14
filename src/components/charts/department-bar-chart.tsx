"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function DepartmentBarChart({
  data,
}: {
  data: { name: string; received: number }[];
}) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#DDE3EA" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: "#5B6572" }}
            interval={0}
            angle={-30}
            textAnchor="end"
            height={70}
          />
          <YAxis tick={{ fontSize: 11, fill: "#5B6572" }} allowDecimals={false} />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 4, borderColor: "#DDE3EA" }}
            cursor={{ fill: "#F4F6F8" }}
          />
          <Bar dataKey="received" fill="#12294B" radius={[3, 3, 0, 0]} name="Requests" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
