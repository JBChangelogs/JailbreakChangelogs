import React, { Suspense } from 'react';
import Breadcrumb from '@/components/Layout/Breadcrumb';
import CalculatorDescription from '@/components/Values/Calculator/CalculatorDescription';
import { CalculatorForm } from '@/components/Values/Calculator/CalculatorForm';
import { fetchItems } from '@/utils/api';
import Loading from './loading';

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
  const tradeItems = items.flatMap(item => {
    const parent = { ...item, is_sub: false, side: undefined };
    const variants = (item.children || []).map(child => ({
      ...parent,
      id: child.id,
      name: child.data.name,
      type: child.data.type,
      cash_value: child.data.cash_value,
      duped_value: child.data.duped_value,
      is_limited: child.data.is_limited ?? item.is_limited,
      is_seasonal: child.data.is_seasonal ?? item.is_seasonal,
      demand: child.data.demand,
      tradable: child.data.tradable ? 1 : 0,
      is_sub: true,
      sub_name: child.sub_name,
      data: child.data,
    }));
    return [parent, ...variants];
  });

  return <CalculatorForm initialItems={tradeItems} />;
}
