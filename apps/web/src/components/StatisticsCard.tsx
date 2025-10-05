import React from "react";

interface StatisticsCardProps {
  title: string;
  value: number;
  description: string;
}

export const StatisticsCard = ({
  title,
  value,
  description,
}: StatisticsCardProps) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  );
};
