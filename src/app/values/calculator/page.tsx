"use client";

import React from 'react';
import Breadcrumb from '@/components/Layout/Breadcrumb';
import CalculatorDescription from '@/components/Values/Calculator/CalculatorDescription';
import { CalculatorForm } from '@/components/Values/Calculator/CalculatorForm';

export default function CalculatorPage() {
  return (
    <main className="container mx-auto">
      <Breadcrumb />
      <CalculatorDescription />
      <CalculatorForm />
    </main>
  );
}
