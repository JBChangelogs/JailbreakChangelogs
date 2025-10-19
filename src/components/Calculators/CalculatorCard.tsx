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
      <div className="bg-secondary-bg border-border-primary hover:border-border-focus hover:shadow-card-shadow h-full rounded-lg border p-6 transition-colors duration-200 hover:shadow-lg">
        <div className="mb-4 flex items-center gap-2">
          <div
            className={`${calculator.color} flex h-8 w-8 items-center justify-center rounded-lg`}
          >
            <Icon
              icon={calculator.icon}
              className="h-5 w-5 text-white"
              inline={true}
            />
          </div>
          <h3 className="text-card-headline text-xl font-semibold">
            {calculator.title}
          </h3>
        </div>
        <p className="text-card-paragraph mb-4">{calculator.description}</p>

        <div className="space-y-2">
          <h4 className="text-primary-text text-sm font-medium">Features:</h4>
          <ul className="text-secondary-text space-y-1 text-sm">
            {calculator.features.map((feature, index) => (
              <li key={index} className="flex items-center gap-2">
                <div
                  className={`${calculator.color} h-1.5 w-1.5 rounded-full`}
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
