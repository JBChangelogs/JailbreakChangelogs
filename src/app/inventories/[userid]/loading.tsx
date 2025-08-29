import Breadcrumb from '@/components/Layout/Breadcrumb';
import InventoryCheckerClient from '../InventoryCheckerClient';

export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumb />
      <h1 className="text-3xl font-bold mb-6">Inventory Checker</h1>
      <InventoryCheckerClient isLoading={true} />
    </div>
  );
}
