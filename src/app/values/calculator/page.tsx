import React, { Suspense } from 'react';
import Breadcrumb from '@/components/Layout/Breadcrumb';
import CalculatorDescription from '@/components/Values/Calculator/CalculatorDescription';
import { CalculatorForm } from '@/components/Values/Calculator/CalculatorForm';
import { fetchItems } from '@/utils/api';
import Loading from './loading';

// ISR configuration - cache for 5 minutes
export const revalidate = 300;

export default function CalculatorPage() {
  return (
    <main className="container mx-auto">
      <Breadcrumb />
      <CalculatorDescription />
      <Suspense fallback={<Loading />}>
        <CalculatorFormWrapper />
      </Suspense>
    </main>
  );
}

async function CalculatorFormWrapper() {
  const items = await fetchItems();
  const tradeItems = items.map(item => ({ ...item, is_sub: false, side: undefined }));

  return <CalculatorForm initialItems={tradeItems} />;
}
