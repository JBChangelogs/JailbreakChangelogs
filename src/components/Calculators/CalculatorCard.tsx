import React from "react";
import Link from "next/link";
import { Icon } from "@/components/UI/IconWrapper";

interface Calculator {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: string;
  category: string;
  features: string[];
  color: string;
}

interface CalculatorCardProps {
  calculator: Calculator;
}

export default function CalculatorCard({ calculator }: CalculatorCardProps) {
  return (
    <Link href={calculator.href} className="group">
      <div className="border-border-primary hover:border-border-focus bg-secondary-bg h-full rounded-lg border p-6 transition-all duration-200 group-hover:scale-[1.02] hover:shadow-lg">
        <div className="mb-4 flex items-start gap-4">
          <div
            className={`${calculator.color} flex h-12 w-12 items-center justify-center rounded-lg`}
          >
            <Icon
              icon={calculator.icon}
              className="h-6 w-6 text-white"
              inline={true}
            />
          </div>
          <div className="flex-1">
            <div className="mb-2">
              <h3 className="text-primary-text text-xl font-semibold transition-colors group-hover:text-blue-400">
                {calculator.title}
              </h3>
            </div>
            <p className="text-secondary-text text-sm leading-relaxed">
              {calculator.description}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-primary-text text-sm font-medium">Features:</h4>
          <ul className="text-secondary-text space-y-1 text-sm">
            {calculator.features.map((feature, index) => (
              <li key={index} className="flex items-center gap-2">
                <div
                  className={`${calculator.color.replace("bg-", "bg-")} h-1.5 w-1.5 rounded-full`}
                />
                {feature}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Link>
  );
}
