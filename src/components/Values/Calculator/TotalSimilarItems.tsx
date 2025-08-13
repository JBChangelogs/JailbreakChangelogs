"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { TradeItem } from "@/types/trading";
import { getItemImagePath, handleImageError } from "@/utils/images";
import { getItemTypeColor } from "@/utils/badgeColors";
import { ArrowsRightLeftIcon } from '@heroicons/react/24/outline';
import { FaArrowCircleUp, FaArrowAltCircleDown } from "react-icons/fa";
import { formatFullValue } from "@/utils/values";

interface TotalSimilarItemsProps {
	targetValue: number;
	items: TradeItem[];
	excludeItems?: TradeItem[];
	typeFilter?: string | null; // when null/undefined, include all types
	range?: number; // +/- range in raw value, default 2.5m
	title?: string;
	accentColor?: string;
	contextLabel?: string;
}

const parseValue = (value: string): number => {
	if (!value || value === "N/A") return 0;
	const lower = value.toLowerCase();
	const num = parseFloat(lower.replace(/[^0-9.]/g, ""));
	if (Number.isNaN(num)) return 0;
	if (lower.includes("k")) return num * 1_000;
	if (lower.includes("m")) return num * 1_000_000;
	if (lower.includes("b")) return num * 1_000_000_000;
	return num;
};

export const TotalSimilarItems: React.FC<TotalSimilarItemsProps> = ({
	targetValue,
	items,
	excludeItems = [],
	typeFilter = null,
	range = 2_500_000,
	title,
	accentColor,
	contextLabel,
}) => {
	const candidates = useMemo(() => {
		if (!items?.length || targetValue <= 0) return [] as Array<{ item: TradeItem; diff: number }>;
		const excludeIdSet = new Set(excludeItems.map(i => i.id));
		const pool = (typeFilter ? items.filter(i => i.type.toLowerCase() === typeFilter.toLowerCase()) : items)
			.filter(i => !excludeIdSet.has(i.id));
		const min = Math.max(0, targetValue - range);
		const max = targetValue + range;
		return pool
			.map((item) => {
				const val = parseValue(item.cash_value);
				return { item, val, diff: Math.abs(val - targetValue) };
			})
			.filter(({ val }) => val >= min && val <= max)
			.sort((a, b) => a.diff - b.diff)
			.slice(0, 12)
			.map(({ item, diff }) => ({ item, diff }));
	}, [items, excludeItems, targetValue, range, typeFilter]);

	if (targetValue <= 0) return null;

	const heading = title || (typeFilter ? `Similar ${typeFilter}s Near Total` : "Similar Items Near Total");

	return (
		<div className="bg-[#212A31] rounded-lg p-6 border border-[#2E3944]">
			<div className="flex items-center justify-between mb-4">
				<div className="flex items-center gap-2">
					<h3 className="text-muted font-semibold">{heading}</h3>
					{contextLabel && (
						<span
							className="inline-flex items-center px-2 py-0.5 text-xs rounded-full text-white font-medium"
							style={{ backgroundColor: accentColor || '#5865F2' }}
						>
							{contextLabel}
						</span>
					)}
				</div>
				<span className="inline-flex items-center gap-1 text-xs text-muted/80 bg-[#2E3944] border border-[#36424E] px-2 py-1 rounded-md">
					<ArrowsRightLeftIcon className="w-4 h-4" />
					<span>Range</span>
					<span className="text-muted">{range.toLocaleString()}</span>
				</span>
			</div>

			{candidates.length === 0 ? (
				<div className="bg-[#2E3944] rounded-lg p-6 text-center text-sm text-muted">
					No items found within ±{range.toLocaleString()} of your total.
				</div>
			) : (
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
					{candidates.map(({ item, diff }) => {
						const itemValue = parseValue(item.cash_value);
						const isAbove = itemValue > targetValue;
						return (
							<Link key={`${item.id}-${item.sub_name || 'base'}`} href={`/item/${item.type.toLowerCase()}/${item.name}`} className="group">
								<div className="bg-[#2e3944] border border-gray-700/50 rounded-lg overflow-hidden transition-all duration-200 hover:scale-[1.02] hover:border-purple-500/30 hover:shadow-lg">
									<div className="relative aspect-video">
										<Image
											src={getItemImagePath(item.type, item.name, true)}
											alt={item.name}
											fill
											unoptimized
											className="object-cover"
											onError={handleImageError}
										/>
									</div>
									<div className="p-4 space-y-2">
										<div className="flex items-center justify-between">
											<h4 className="text-gray-200 font-medium group-hover:text-blue-400 transition-colors line-clamp-1 mr-2">{item.name}</h4>
											<span
												className="inline-block px-2 py-0.5 text-xs rounded-full text-white"
												style={{ backgroundColor: getItemTypeColor(item.type) }}
											>
												{item.type}
											</span>
										</div>
										<div className="flex items-center justify-between text-xs text-muted/80">
											<span className="flex flex-col">
												<span>Cash: {formatFullValue(item.cash_value)}</span>
												<span>Duped: {formatFullValue(item.duped_value)}</span>
											</span>
											{diff === 0 ? (
												<span className="inline-flex items-center gap-1 text-[#E5E7EB]">
													<span>Same value</span>
												</span>
											) : (
												<span className={`inline-flex items-center gap-1 ${isAbove ? 'text-red-400' : 'text-[#43B581]'} `}>
													{isAbove ? <FaArrowCircleUp className="w-4 h-4" /> : <FaArrowAltCircleDown className="w-4 h-4" />}
													<span>{isAbove ? 'Above by' : 'Below by'} {diff.toLocaleString()}</span>
												</span>
											)}
										</div>
									</div>
								</div>
							</Link>
						);
					})}
				</div>
			)}
		</div>
	);
};

export default TotalSimilarItems; 