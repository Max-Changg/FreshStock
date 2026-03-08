import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './Layout';
import { Inventory } from '@/pages/Inventory';
import { Insights } from '@/pages/Insights';
import { Suppliers } from '@/pages/Suppliers';
import { Planning } from '@/pages/Planning';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Inventory />} />
          <Route path="/insights" element={<Insights />} />
          <Route path="/suppliers" element={<Suppliers />} />
          <Route path="/planning" element={<Planning />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
